from pymongo import MongoClient
import os

def get_mongo_client():
    # Replace with your actual connection string or use environment variable
    uri = os.environ.get('MONGO_URI', 'mongodb+srv://Adarsh1:Adsak913@action-hub-cluster.gyq5cyf.mongodb.net/?retryWrites=true&w=majority&appName=Action-Hub-Cluster')
    return MongoClient(uri)

def fetch_events(collection_name="events"):
    client = get_mongo_client()
    db = client[os.environ.get('MONGO_DB', 'test')]  # Replace with your database name or set env var
    collection = db[collection_name]
    events = list(collection.find({}, {"_id": 0}))  # Exclude MongoDB's _id field
    client.close()
    return events 