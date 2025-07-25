def score_event(event):
    score = 0
    if event.get('eventType', '').lower() == 'academic':
        score += 2
    if 'auditorium' in event.get('venue', '').lower():
        score += 1
    if event.get('expected_count', 0) > 100:
        score += 2
    # Add more rules as needed
    return score 