import requests
from datetime import datetime, timedelta
import random

API_BASE = 'http://localhost:5100/api/event'
APPROVER_EMAIL = 'hod@university.edu'

# 1. Delete all events for the approver
resp = requests.delete(f'{API_BASE}/for-approver', params={'email': APPROVER_EMAIL})
print('Deleted:', resp.json())

# 2. Add 50 new events with varied dates and types
venues = ['Main Auditorium', 'Seminar Hall A', 'Lab Block 1']
event_types = ['academic', 'cultural', 'tech']
today = datetime.now()

for i in range(50):
    # Mix of nearby and distant dates
    if i % 3 == 0:
        # Very close (within 7 days)
        event_date = today + timedelta(days=random.randint(0, 7))
    elif i % 3 == 1:
        # Medium future (8-30 days)
        event_date = today + timedelta(days=random.randint(8, 30))
    else:
        # Far future (31-400 days)
        event_date = today + timedelta(days=random.randint(31, 400))
    event = {
        'title': f'Priority Test Event {i+1}',
        'description': f'Automated priority test event number {i+1}',
        'date': event_date.strftime('%Y-%m-%d'),
        'venue': random.choice(venues),
        'eventType': random.choice(event_types),
        'expected_count': random.choice([30, 80, 120, 200, 400]),
        'organizer': f'auto_organizer_{i+1}@university.edu'
    }
    r = requests.post(f'{API_BASE}/book', json=event)
    print(f'Event {i+1}:', r.status_code, r.json()) 