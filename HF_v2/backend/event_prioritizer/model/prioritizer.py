import os
import joblib
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from event_prioritizer.utils.scoring_rules import score_event

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), 'scaler.pkl')

# Load model and scaler if available
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
else:
    model = None
if os.path.exists(SCALER_PATH):
    scaler = joblib.load(SCALER_PATH)
else:
    scaler = None

# Feature extraction for an event
def extract_features(event):
    # Support both camelCase and snake_case field names
    event_type = event.get('eventType') or event.get('event_type') or ''
    event_type_val = 1 if event_type.lower() == 'academic' else 0
    venue = event.get('venue') or event.get('preferred_venue') or ''
    venue_auditorium = 1 if 'auditorium' in venue.lower() else 0
    expected_count = (
        event.get('expected_count')
        or event.get('expected_attendance')
        or 0
    )
    num_approvers = len(event.get('approvers', []))
    from datetime import datetime, date
    try:
        event_date_str = event.get('date')
        event_date = datetime.strptime(event_date_str, '%Y-%m-%d') if event_date_str else datetime.now()
        created_at_str = event.get('createdAt') or event.get('created_at')
        if created_at_str:
            created_at = datetime.strptime(created_at_str[:10], '%Y-%m-%d')
        else:
            created_at = event_date  # fallback: use event date
        days_until_event = (event_date - created_at).days
    except Exception:
        days_until_event = 0
    return [event_type_val, venue_auditorium, expected_count, num_approvers, days_until_event]

def rank_events(events):
    features = np.array([extract_features(e) for e in events])
    rule_scores = [score_event(e) for e in events]
    ml_scores = [0] * len(events)
    priorities = ['Medium'] * len(events)
    if model and scaler:
        features_scaled = scaler.transform(features)
        ml_preds = model.predict(features_scaled)
        ml_scores = [2 if p == 'high' else 1 if p == 'medium' else 0 for p in ml_preds]
        priorities = [p.capitalize() for p in ml_preds]
    else:
        # Assign priorities based on rule-based score thresholds
        priorities = []
        for score in rule_scores:
            if score >= 4:
                priorities.append('High')
            elif score >= 2:
                priorities.append('Medium')
            else:
                priorities.append('Low')
    # Combine rule and ML scores
    combined_scores = [r + m*3 for r, m in zip(rule_scores, ml_scores)]
    # Sort events by combined score descending
    ranked = sorted(zip(events, priorities, combined_scores), key=lambda x: x[2], reverse=True)
    return [
        {**e, 'priority': p, 'score': s}
        for e, p, s in ranked
    ] 