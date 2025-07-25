import json
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler
import random
import os

def generate_synthetic_events(n=100):
    event_types = ['academic', 'cultural', 'sports', 'workshop']
    venues = ['Main Auditorium', 'Open Grounds', 'Conference Hall', 'Lab 1']
    events = []
    for _ in range(n):
        event_type = random.choice(event_types)
        venue = random.choice(venues)
        expected_count = random.randint(20, 300)
        num_approvers = random.randint(1, 5)
        days_until_event = random.randint(0, 60)
        label = 'high' if event_type == 'academic' and expected_count > 100 else (
            'medium' if expected_count > 50 else 'low')
        events.append({
            'eventType': event_type,
            'venue': venue,
            'expected_count': expected_count,
            'num_approvers': num_approvers,
            'days_until_event': days_until_event,
            'label': label
        })
    return events

def extract_features(events):
    X = []
    y = []
    for e in events:
        event_type = 1 if e['eventType'] == 'academic' else 0
        venue_auditorium = 1 if 'auditorium' in e['venue'].lower() else 0
        expected_count = e['expected_count']
        num_approvers = e['num_approvers']
        days_until_event = e['days_until_event']
        X.append([event_type, venue_auditorium, expected_count, num_approvers, days_until_event])
        y.append(e['label'])
    return np.array(X), np.array(y)

def main():
    events = generate_synthetic_events()
    X, y = extract_features(events)
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_scaled, y)
    # Save model and scaler
    model_path = os.path.join(os.path.dirname(__file__), '../model/model.pkl')
    scaler_path = os.path.join(os.path.dirname(__file__), '../model/scaler.pkl')
    joblib.dump(clf, model_path)
    joblib.dump(scaler, scaler_path)
    print('Model and scaler saved.')

if __name__ == '__main__':
    main() 