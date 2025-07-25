import pandas as pd
from flask import Flask, request, jsonify
from datetime import datetime, timedelta
from gemini_nlp import generate_structured_data, generate_gemini_response
from gemini_parser import generate_gemini_response
import json
import re

app = Flask(__name__)

# === Load Holiday Data ===
def load_holidays(file_path="holidays.xlsx"):
    df = pd.read_excel(file_path)
    return set(pd.to_datetime(df['Date']).dt.date)

# === Load Exam Date Ranges ===
def load_exam_dates(file_path="exams.xlsx"):
    df = pd.read_excel(file_path)
    print("[DEBUG] Exam columns:", df.columns.tolist())  # Debug print
    exam_dates = set()
    for _, row in df.iterrows():
        start = pd.to_datetime(row['Start Date']).date()
        end = pd.to_datetime(row['End Date']).date()
        for i in range((end - start).days + 1):
            exam_dates.add(start + timedelta(days=i))
    return exam_dates

# === Load Venue Availability ===
def load_venue_availability(file_path="venue_availability.xlsx"):
    df = pd.read_excel(file_path)
    df['Date'] = pd.to_datetime(df['Date']).dt.date
    return df

BUFFER_DAYS = 1  # buffer before and after event

# --- Date Validation Logic ---
def suggest_event_start_date(duration_days, venue, constraints=[], latest_allowed_date=None, skipped=None):
    today = datetime.now().date()
    search_date = today + timedelta(days=1)
    skipped = skipped if skipped is not None else []
    holidays = load_holidays()
    exam_dates = load_exam_dates()
    venue_df = load_venue_availability()
    # Ensure venue is a string to avoid NoneType errors
    venue = venue or ""
    max_days = 30
    days_checked = 0
    while True:
        if latest_allowed_date and search_date > latest_allowed_date:
            return None, None, skipped
        if days_checked >= max_days:
            return None, None, skipped
        end_date = search_date + timedelta(days=duration_days - 1)
        reasons = []
        for i in range(duration_days):
            day = search_date + timedelta(days=i)
            if day in holidays:
                reasons.append(f"{day}: Holiday")
            if day in exam_dates:
                reasons.append(f"{day}: Exam")
            if day.weekday() >= 5:
                reasons.append(f"{day}: Weekend")
            venue_available = venue_df[
                (venue_df['Date'] == day) & 
                (venue_df['Venue Name'].str.lower() == venue.lower())
            ]
            if venue_available.empty or not venue_available.iloc[0]['Is Available']:
                reasons.append(f"{day}: {venue} not available")
        if reasons:
            skipped.extend(reasons)
            search_date += timedelta(days=1)
            days_checked += 1
            continue
        return search_date, end_date, skipped

def parse_constraints(constraints):
    holidays = load_holidays()
    # Try to find Diwali by name or by month (October)
    diwali_date = None
    try:
        df = pd.read_excel("holidays.xlsx")
        diwali_row = df[df['Occasion'].str.lower().str.contains('diwali', na=False)]
        if not diwali_row.empty:
            diwali_date = pd.to_datetime(diwali_row.iloc[0]['Date']).date()
    except Exception:
        # fallback: pick any October holiday
        for d in holidays:
            if d.month == 10:
                diwali_date = d
                break
    latest_allowed_date = None
    for c in constraints:
        if c is None:
            continue
        c_lower = c.lower() if isinstance(c, str) else str(c).lower()
        if "before diwali" in c_lower and diwali_date:
            latest_allowed_date = diwali_date - timedelta(days=1)
        # Add other rules as needed
    return latest_allowed_date

@app.route("/")
def home():
    return "Gemini NLP API is running! Use /api/suggest-date for event parsing and date suggestion."

@app.route("/api/suggest-date", methods=["POST"])
def suggest_date():
    data = request.get_json(force=True)
    description = data.get("description", "")
    if not description:
        return jsonify({"error": "Description is required"}), 400
    try:
        # --- Use Gemini to extract structured data ---
        system_prompt = """
You are a highly intelligent assistant for an event automation system at a university. Your task is to extract clean, structured JSON data from a natural language event description provided by an organizer. This information will be used to auto-suggest dates, venues, and manage logistics like equipment and resource needs.

Always return *strictly valid JSON* with the following fields:
- *event_type*: (string) Type of the event (e.g., seminar, workshop, sports, cultural, festival, meeting)
- *title*: (string) A concise title for the event (generate if not given)
- *description*: (string) A clean and short explanation of the event
- *duration_days*: (integer) Number of days the event will run (default: 1 if not stated)
- *preferred_venue*: (string) Venue name if specified
- *expected_attendance*: (integer) Estimated number of participants
- *constraints*: (array of strings) Important constraints (e.g., "not during exams", "before Diwali", "evening only")
- *resource_requirements*: (array of strings) List of specific resources mentioned (e.g., "mic", "projector", "cleaning", "camera", "lighting", "electrician")
📌 Notes:
- Do not guess values not hinted at. Only include what’s present or implied.
- Be case-sensitive with keys. Follow the exact key names and JSON syntax.
- NEVER include explanations or commentary.
- NEVER wrap output in triple backticks.
---
Example Input:
Plan a 2-day AI workshop before Diwali, not during exams, in the main auditorium, expecting ~150 students. We’ll need projectors, extra lighting, and cleaning staff on both days.
Example Output:
{
  "event_type": "workshop",
  "title": "AI Workshop",
  "description": "2-day AI workshop in main auditorium",
  "duration_days": 2,
  "preferred_venue": "main auditorium",
  "expected_attendance": 150,
  "constraints": ["before Diwali", "not during exams"],
  "resource_requirements": ["projector", "lighting", "cleaning"]
}
"""
        prompt = system_prompt + "\n" + description
        result = generate_gemini_response(prompt)
        print('Raw Gemini output:', repr(result))
        # Clean output robustly
        import re
        result = result.strip()
        result = re.sub(r'^```[jJ][sS][oO][nN]?\\s*', '', result)
        result = re.sub(r'^```\\s*', '', result)
        result = re.sub(r'```$', '', result)
        result = result.strip()
        # Extract only the JSON object from the output
        json_start = result.find('{')
        json_end = result.rfind('}') + 1
        if json_start != -1 and json_end != -1 and json_end > json_start:
            result = result[json_start:json_end]
        else:
            print('No JSON object found in Gemini output:', repr(result))
            return jsonify({"error": "No JSON object found in Gemini output", "raw_output": result}), 500
        try:
            structured_data = json.loads(result)
        except Exception as e:
            print('JSON parse error:', e, 'Raw output:', repr(result))
            return jsonify({"error": f"Failed to parse Gemini output as JSON: {e}", "raw_output": result}), 500
        # --- Venue Suggestion Logic ---
        # Venue DB and rules (should be at module level, but repeat here for clarity)
        VENUE_DB = [
            {"name": "Main Auditorium", "capacity": 400, "type": "auditorium"},
            {"name": "Seminar Hall A", "capacity": 90, "type": "seminar"},
            {"name": "Seminar Hall B", "capacity": 80, "type": "seminar"},
            {"name": "Lab Block 1", "capacity": 50, "type": "lab"},
            {"name": "Lab Block 2", "capacity": 50, "type": "lab"},
            {"name": "Room 101", "capacity": 40, "type": "classroom"},
            {"name": "Room 102", "capacity": 40, "type": "classroom"},
            {"name": "AV Hall", "capacity": 70, "type": "media"},
            {"name": "Conference Room", "capacity": 30, "type": "meeting"},
            {"name": "Mechanical Seminar Hall", "capacity": 120, "type": "seminar"}
        ]
        EVENT_VENUE_RULES = {
            "workshop": ["seminar", "media", "classroom", "auditorium"],
            "seminar": ["seminar", "auditorium", "meeting"],
            "cultural": ["auditorium"],
            "technical": ["lab"],
            "others": ["classroom", "meeting", "auditorium"]
        }
        def suggest_venues(event_type, expected_attendance):
            event_type = (event_type or "others").lower()
            preferred_types = EVENT_VENUE_RULES.get(event_type, EVENT_VENUE_RULES["others"])
            suitable_venues = sorted(
                [v for v in VENUE_DB if v["capacity"] >= expected_attendance and v["type"] in preferred_types],
                key=lambda v: (preferred_types.index(v["type"]), v["capacity"])
            )
            return [v["name"] for v in suitable_venues], preferred_types
        def suggest_available_venues(event_type, expected_attendance, booked=None):
            booked = booked or []
            all_suggestions, preferred_types = suggest_venues(event_type, expected_attendance)
            available = [v for v in all_suggestions if v not in booked]
            return available, preferred_types
        # --- Date Suggestion Logic ---
        constraints = structured_data.get("constraints", [])
        if isinstance(constraints, dict):
            constraints = list(constraints.values())
        duration = structured_data.get("duration_days", 1)
        venue = structured_data.get("preferred_venue") or "Main Auditorium"
        event_type = structured_data.get("event_type") or "others"
        expected_attendance = structured_data.get("expected_attendance") or 1
        latest_allowed_date = parse_constraints(constraints)
        skipped_reasons = []
        start_date, end_date, skipped_reasons = suggest_event_start_date(
            duration, venue, constraints, latest_allowed_date, skipped_reasons
        )
        structured_data["suggested_start_date"] = start_date.strftime("%Y-%m-%d") if start_date else "No suitable date found"
        structured_data["suggested_end_date"] = end_date.strftime("%Y-%m-%d") if end_date else None
        structured_data["skipped_reasons"] = skipped_reasons
        # --- Venue Suggestions ---
        booked_venues = []  # In production, fetch from DB or calendar
        suggested_venues, preferred_types = suggest_available_venues(event_type, expected_attendance, booked_venues)
        structured_data["venue_suggestions"] = {
            "suggested_venues": suggested_venues,
            "based_on": {
                "event_type": event_type,
                "audience": expected_attendance,
                "preferred_types": preferred_types
            }
        }
        return jsonify(structured_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/resource-recommend", methods=["POST"])
def resource_recommend():
    data = request.get_json(force=True)
    # Build the system prompt
    system_prompt = """
You are a smart assistant that recommends required event resources.

Given a JSON input with:
- event_type
- venue
- duration_days
- expected_attendance

...and optionally history of similar events and their resources, respond with:
{
  "camera": int,
  "mic": int,
  "projector": int,
  "cleaning_staff": int,
  "electric_support": true/false,
  "wifi_support": true/false
}

Respond with strictly valid JSON only. Do not include any explanation, markdown, or commentary. Do not wrap the output in triple backticks or any other formatting. Output only the JSON object.
"""
    # Compose the prompt
    prompt = system_prompt + "\n" + json.dumps(data)
    # Call Gemini
    result = generate_gemini_response(prompt)
    print('Raw Gemini output:', repr(result))
    # Clean output robustly
    result = re.sub(r'^```[jJ][sS][oO][nN]?\s*', '', result)
    result = re.sub(r'^```\s*', '', result)
    result = re.sub(r'```$', '', result)
    result = result.strip()
    # Try to parse as JSON
    try:
        resources = json.loads(result)
        return jsonify(resources)
    except Exception as e:
        print('JSON parse error:', e)
        return jsonify({"error": f"Failed to parse Gemini output as JSON: {e}", "raw_output": result}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5200) 