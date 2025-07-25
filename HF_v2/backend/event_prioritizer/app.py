from flask import Flask, request, jsonify
from model.prioritizer import rank_events
from utils.mongo import fetch_events

app = Flask(__name__)

@app.route('/')
def home():
    return "Event Prioritization API is running. Use /api/prioritize-events."

@app.route('/api/prioritize-events', methods=['POST'])
def prioritize():
    events = request.json.get('events', [])
    prioritized_events = rank_events(events)
    return jsonify(prioritized_events)

@app.route('/api/prioritize-mongo-events', methods=['GET'])
def prioritize_mongo_events():
    events = fetch_events()
    prioritized_events = rank_events(events)
    return jsonify(prioritized_events)

if __name__ == '__main__':
    app.run(debug=True) 