import os
import json
import re
from google import genai
from google.genai import types

def generate_structured_data(user_prompt: str):
    api_key = 'AIzaSyCeAiP47EG4klznL3apWmrD4faN6XT8sRE'
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY not set in environment variables.")

    client = genai.Client(api_key=api_key)

    model = "gemini-2.5-pro"

    system_prompt = """
You are a smart assistant that extracts structured data from event planning descriptions.

Given a user description, return a JSON with the following fields:
- event_type: the type of event
- duration_days: number of days (default to 1 if not mentioned)
- preferred_venue: where the event is planned
- expected_attendance: number of attendees (int)
- constraints: a list of constraints or conditions from the prompt

Respond only with valid JSON and make sure to close all brackets and braces properly.
Do not include any extra explanation.

Example Input:
"Plan a casual event before Diwali, not during exams, in the main auditorium, expecting ~150 students."

Output:
{
  "event_type": "casual event",
  "duration_days": 1,
  "preferred_venue": "main auditorium",
  "expected_attendance": 150,
  "constraints": ["before Diwali", "not during exams"]
}
"""

    contents = [
        types.Content(role="user", parts=[types.Part(text=system_prompt)]),
        types.Content(role="user", parts=[types.Part(text=user_prompt)])
    ]

    generate_content_config = types.GenerateContentConfig(
        temperature=0.2,
        top_p=1,
        top_k=1,
        max_output_tokens=2048,
    )

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=generate_content_config
    )

    if not response.candidates:
        return {"error": "No candidates returned by the model."}

    candidate = response.candidates[0]

    if candidate.content is None or not candidate.content.parts:
        return {"error": "No content parts found in the candidate."}

    result = candidate.content.parts[0].text.strip()

    # Remove Markdown code block markers and 'json' language tag
    result = re.sub(r"^```[jJ][sS][oO][nN]?\s*", "", result)
    result = re.sub(r"^```\s*", "", result)
    result = re.sub(r"```$", "", result)
    result = result.strip()

    try:
        data = json.loads(result)
        return data
    except Exception as e:
        return {"error": f"Failed to parse output as JSON: {e}", "raw_output": result}

def generate_gemini_response(prompt: str):
    api_key = 'AIzaSyCeAiP47EG4klznL3apWmrD4faN6XT8sRE'
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY not set in environment variables.")

    client = genai.Client(api_key=api_key)
    model = "gemini-2.5-pro"

    contents = [
        types.Content(role="user", parts=[types.Part(text=prompt)])
    ]

    generate_content_config = types.GenerateContentConfig(
        temperature=0.2,
        top_p=1,
        top_k=1,
        max_output_tokens=2048,
    )

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=generate_content_config
    )

    if not response.candidates:
        return "{}"

    candidate = response.candidates[0]
    if candidate.content is None or not candidate.content.parts:
        return "{}"

    result = candidate.content.parts[0].text.strip()
    # Remove Markdown code block markers and 'json' language tag
    import re
    result = re.sub(r"^```[jJ][sS][oO][nN]?\s*", "", result)
    result = re.sub(r"^```\s*", "", result)
    result = re.sub(r"```$", "", result)
    result = result.strip()
    return result

if __name__ == "__main__":
    user_input = input("Describe your event: ")
    generate_structured_data(user_input)
