# Gemini NLP Event Scheduler

A professional event scheduling system that uses Gemini LLM for natural language event extraction and robust Python logic for date suggestion, considering holidays, exams, venue availability, and user constraints.

---

## 🚀 Features
- Extracts structured event data from free-form descriptions using Gemini API
- Suggests best event dates, avoiding holidays, exams, weekends, and venue conflicts
- Reads holidays, exams, and venue availability from Excel files
- Streamlit UI for easy interaction

---

## 🛠️ Setup Instructions

### 1. Clone the Repository
```bash
# Clone your repo (replace URL with your own)
git clone <your-repo-url>
cd <your-repo-folder>
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Prepare Excel Data Files
Place these files in the `backend/` directory:

#### `holidays.xlsx`
| Date       | Occasion      |
|------------|--------------|
| 2025-10-20 | Diwali       |
| 2025-07-24 | Founder's Day|

#### `exams.xlsx`
| Start Date | End Date   | Exam Type    |
|------------|------------|--------------|
| 2025-09-10 | 2025-09-20 | Mid Semester |
| 2025-11-15 | 2025-11-25 | Finals       |

#### `venue_availability.xlsx`
| Date       | Venue Name      | Is Available | Reason      |
|------------|----------------|--------------|-------------|
| 2025-07-24 | Main Auditorium| FALSE        | Maintenance |
| 2025-07-25 | Main Auditorium| TRUE         |             |

- **Date columns must be in YYYY-MM-DD format.**
- **Is Available** should be TRUE or FALSE (case-insensitive).

### 4. Set Your Gemini API Key

#### PowerShell (Windows):
```powershell
 $env:GEMINI_API_KEY="AIzaSyCeAiP47EG4klznL3apWmrD4faN6XT8sRE"
```
#### Command Prompt:
```cmd
set GEMINI_API_KEY=your_actual_api_key_here
```
#### Or set as a permanent environment variable via System Properties.

---

## 🖥️ Running the Backend

```bash
cd backend
python gemini_nlp_api.py
```
- The API will be available at `http://localhost:5000/api/suggest-date`

---

## 🌐 Running the Streamlit Frontend

```bash
cd backend
streamlit run app.py
```
- Open [http://localhost:8501](http://localhost:8501) in your browser.
- Enter an event description and get structured data + date suggestions.

---

## 📝 Example Event Description
```
Plan a two-day tech talk before Diwali, not during exams, in the SKT hall, expecting 190 students.
```

---

## 🛠️ Troubleshooting
- **503 UNAVAILABLE**: Gemini API is overloaded. Wait and retry.
- **Missing optional dependency 'openpyxl'**: Run `pip install openpyxl`.
- **KeyError: 'Start Date'**: Check your `exams.xlsx` column names.
- **No suggested date found**: All dates may be blocked by constraints or venue unavailability.

---

## 📦 Project Structure
```
backend/
  gemini_nlp.py           # Gemini LLM extraction logic
  gemini_nlp_api.py       # Flask API (event parsing + date suggestion)
  app.py                  # Streamlit frontend
  holidays.xlsx           # Holiday data
  exams.xlsx              # Exam periods
  venue_availability.xlsx # Venue availability
requirements.txt
README.md
```

---

## ✨ Credits
- Built with Gemini LLM, Flask, pandas, and Streamlit.
- Designed for robust, real-world academic event scheduling. 