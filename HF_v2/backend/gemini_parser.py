import os
import re
import google.generativeai as genai
import json

def build_event_extraction_prompt(user_input: str) -> str:
    return f"""
You are a JSON data extraction assistant.

You will be given a scheduling assistant's summary for an event. Extract the structured data below into **strict JSON** format. The assistant's text includes suggested start date, venue preferences, skipped dates, and reasons.

Required Output Fields:
- suggested_start_date: (null if none found)
- preferred_venue: The venue mentioned as input
- duration_days: number of days (extract from input like "2-day event")
- constraints: any constraints mentioned in input or summary (like "before exams", "not on weekends")
- skipped_dates: list of {{ "date": ..., "reasons": [...] }} — combine reasons per date
- suggested_venues: OPTIONAL — only include if multiple alternatives are clearly suggested by the assistant, and if the preferred venue was not fixed in input.

Instructions:
- If the preferred venue was clearly mentioned in the user’s request (like "seminar hall" or "main auditorium"), do NOT include `suggested_venues`.
- If no valid start date is found, set `suggested_start_date` to null.
- Remove duplicate skipped dates, and merge all reasons for each date.
- Return output as raw JSON only — no markdown or explanation.

Input:
\"\"\"{user_input}\"\"\"
"""

def generate_gemini_response(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "AIzaSyCeAiP47EG4klznL3apWmrD4faN6XT8sRE")  # Replace with your key
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY not set in environment variables.")

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel("gemini-2.5-pro")
    config = {
        "temperature": 0.2,
        "top_p": 1,
        "top_k": 1,
        "max_output_tokens": 2048,
    }

    try:
        response = model.generate_content(
            contents=[{"role": "user", "parts": [prompt]}],
            generation_config=config
        )

        if not response.candidates:
            return "{}"

        result = response.candidates[0].content.parts[0].text.strip()

        # Clean markdown, remove `json` or  blocks
        result = re.sub(r"^(`{3,}|json)", "", result, flags=re.IGNORECASE).strip()
        result = re.sub(r"`{3,}$", "", result).strip()

        # Ensure it's valid JSON
        json.loads(result)  # raises if not valid
        return result

    except Exception as e:
        print("❌ Error from Gemini:", e)
        return "{}"

if __name__ == "__main__":
    user_input = input("🗓  Describe your event: ").strip()
    if not user_input:
        print("No input provided. Exiting.")
        exit(1)
    prompt = build_event_extraction_prompt(user_input)
    structured_output = generate_gemini_response(prompt)
    print("\n✅ Structured JSON Output:\n", structured_output) 