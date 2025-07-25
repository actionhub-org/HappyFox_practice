# Event Prioritizer

An AI-powered event approval and prioritization system using Flask, MongoDB Atlas, Scikit-learn, and Streamlit.

---

## Features
- **Rule-based + ML event prioritization**
- **MongoDB Atlas** integration for live event data
- **REST API** for event ranking
- **Streamlit UI** for interactive visualization

---

## Folder Structure
```
event_prioritizer/
│
├── app.py                # Flask API
├── model/
│   └── prioritizer.py    # ML + rule logic
├── train/
│   └── train_model.py    # Model training
├── utils/
│   ├── scoring_rules.py  # Rule-based scoring
│   └── mongo.py          # MongoDB utilities
├── requirements.txt      # Python dependencies
├── streamlit_app.py      # Streamlit frontend
└── README.md             # This file
```

---

## Setup Instructions

### 1. **Clone the Repository**
```
git clone <your-repo-url>
cd <your-repo>/event_prioritizer
```

### 2. **Install Dependencies**
```
pip install -r requirements.txt
```

### 3. **Configure MongoDB Atlas**
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Whitelist your IP address
- Create a database user
- Get your connection string (URI)

#### **Set Environment Variables:**
On Windows (cmd):
```
set MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
set MONGO_DB=<dbname>
```
On Mac/Linux (bash):
```
export MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
export MONGO_DB=<dbname>
```

---

## Usage

### 1. **Train the ML Model (Optional)**
```
python train/train_model.py
```

### 2. **Start the Flask API**
```
python app.py
```
- The API will run at `http://localhost:5000`
- Endpoints:
  - `GET /api/prioritize-mongo-events` — Prioritize events from MongoDB

### 3. **Start the Streamlit Frontend**
In a new terminal:
```
python -m streamlit run streamlit_app.py
```
- Open the browser link shown (usually http://localhost:8501)
- Click **"Prioritize Events (from MongoDB)"** to see results

---

## Troubleshooting
- **MongoDB connection errors:**
  - Check your URI, DB name, and IP whitelist in Atlas
  - Make sure your cluster is running
- **Flask or Streamlit not running:**
  - Start Flask first, then Streamlit
- **Model not found:**
  - Run `python train/train_model.py` to generate model files

---

## Security
- Never commit your real MongoDB credentials to public repos.
- Use environment variables for sensitive info.

---

## Credits
- Built with Flask, Scikit-learn, Streamlit, and MongoDB Atlas 