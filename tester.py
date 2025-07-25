import requests
import random
from datetime import datetime, timedelta

API_URL = "http://localhost:5100/api/event/book"
APPROVER_EMAIL = "hod@university.edu"  # Use the approver you want to test

today = datetime.now()
for i in range(50):
    # Mix of recent past, today, and next 30 days
    if i % 5 == 0:
        event_date = today - timedelta(days=random.randint(1, 10))  # 1-10 days ago
    elif i % 5 == 1:
        event_date = today  # today
    else:
        event_date = today + timedelta(days=random.randint(1, 30))  # next 1-30 days
    event = {
        "title": f"Test Event {i+1}",
        "description": f"Automated test event number {i+1}",
        "date": event_date.strftime('%Y-%m-%d'),
        "venue": random.choice(["Main Auditorium", "Seminar Hall A", "Lab Block 1"]),
        "eventType": random.choice(["academic", "cultural", "tech"]),
        "organizer": f"organizer{i+1}@university.edu",
        "expected_attendance": random.choice([30, 80, 120, 200, 400]),
        "duration_days": random.choice([1, 2, 3])
    }
    response = requests.post(API_URL, json=event)
    print(f"Event {i+1}: Status {response.status_code} - {response.json()}")