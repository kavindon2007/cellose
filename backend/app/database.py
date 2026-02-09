import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime

# Initialize Firestore
def initialize_firestore():
    """Initializes Firebase Firestore using a local serviceAccountKey.json."""
    # Base directory of this script
    base_dir = os.path.dirname(os.path.abspath(__file__))
    cred_filename = "serviceAccountKey.json"
    cred_path = os.path.join(base_dir, cred_filename)
    
    # Check if the credentials file exists
    if not os.path.exists(cred_path):
        # Fallback: Check if it is in the project root or parent directory
        # Assuming backend/app/../.. might be project root or similar.
        # We will check one level up (backend/) and two levels up (root)
        possible_paths = [
            os.path.join(os.path.dirname(base_dir), cred_filename),
            os.path.join(os.path.dirname(os.path.dirname(base_dir)), cred_filename)
        ]
        found = False
        for path in possible_paths:
            if os.path.exists(path):
                cred_path = path
                found = True
                break
        
        if not found:
            print(f"Error: {cred_filename} not found. Please place it in {base_dir} or a parent directory.")
            return None

    try:
        # Check if already initialized to avoid "app already exists" error
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"Failed to initialize Firestore: {e}")
        return None

db = initialize_firestore()

def create_ticket(data: dict):
    """
    Saves a new emergency document to a 'reports' collection.
    Adds a server-side timestamp and returns the new document ID.
    """
    if db is None:
        print("Database not initialized.")
        return None

    try:
        # Add server-side timestamp
        data["timestamp"] = firestore.SERVER_TIMESTAMP
        
        # Add to 'reports' collection
        update_time, doc_ref = db.collection("reports").add(data)
        
        return doc_ref.id
    except Exception as e:
        print(f"Error creating ticket: {e}")
        return None

def update_ticket_status(ticket_id: str, new_status: str):
    """
    Updates the 'status' field of a specific document.
    """
    if db is None:
        print("Database not initialized.")
        return None

    try:
        doc_ref = db.collection("reports").document(ticket_id)
        
        # Check if document exists before updating if necessary, 
        # but update() will fail if it doesn't exist depending on how we want to handle it.
        # Here we just update.
        doc_ref.update({"status": new_status})
        print(f"Ticket {ticket_id} status updated to {new_status}.")
        return True
    except Exception as e:
        print(f"Error updating ticket status: {e}")
        return False
