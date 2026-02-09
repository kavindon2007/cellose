import os
import shutil
import random
import datetime
from typing import List, Optional
from enum import Enum

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# ==========================================
# 1. CONFIGURATION & DATABASE SETUP
# ==========================================

# Create a 'uploads' directory for images/videos
os.makedirs("uploads", exist_ok=True)

# Database Setup (SQLite for simplicity)
SQLALCHEMY_DATABASE_URL = "sqlite:///./resq_ai.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Enums for Standardization ---
class IncidentStatus(str, Enum):
    RECEIVED = "Request Received"
    PREPARING = "Preparing"
    DISPATCHED = "Team Dispatched"
    ON_THE_WAY = "On the Way"
    IN_PROGRESS = "Action in Progress"
    RESOLVED = "Resolved"

class SeverityLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class EmergencyType(str, Enum):
    POLICE = "Police"
    AMBULANCE = "Ambulance"
    FIRE = "Fire Station"
    GENERAL = "General"

# --- Database Model ---
class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    media_path = Column(String, nullable=True) # Path to uploaded image/video
    
    # AI Analysis Results
    detected_type = Column(String) # e.g., "Fire Station, Ambulance"
    severity = Column(String)      # e.g., "Critical"
    summary_message = Column(String)
    
    # Status & Meta
    status = Column(String, default=IncidentStatus.RECEIVED.value)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Innovation: Multi-language support
    original_language = Column(String, default="en")

Base.metadata.create_all(bind=engine)

# ==========================================
# 2. FASTAPI APP & WEBSOCKETS
# ==========================================

app = FastAPI(title="ResQ-AI Backend", description="Emergency Response System API")

# CORS - Allow your React Frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files statically (so frontend can display images)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- WebSocket Manager for Real-Time Updates ---
class ConnectionManager:
    def __init__(self):
        # Store active connections: {incident_id: [websocket1, websocket2]}
        self.active_connections: dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, incident_id: int):
        await websocket.accept()
        if incident_id not in self.active_connections:
            self.active_connections[incident_id] = []
        self.active_connections[incident_id].append(websocket)

    def disconnect(self, websocket: WebSocket, incident_id: int):
        if incident_id in self.active_connections:
            self.active_connections[incident_id].remove(websocket)
            if not self.active_connections[incident_id]:
                del self.active_connections[incident_id]

    async def broadcast_status(self, incident_id: int, status: str):
        if incident_id in self.active_connections:
            for connection in self.active_connections[incident_id]:
                await connection.send_text(status)

manager = ConnectionManager()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 3. AI LOGIC (THE "BRAIN")
# ==========================================

def analyze_incident_with_ai(text: str, has_media: bool) -> dict:
    """
    SIMULATED AI FUNCTION.
    In a real hackathon, replace this with a call to OpenAI API (GPT-4) or Gemini API.
    """
    text_lower = text.lower()
    
    # 1. Classification Logic (Keyword based simulation)
    categories = []
    if "fire" in text_lower or "smoke" in text_lower or "burn" in text_lower:
        categories.append(EmergencyType.FIRE.value)
    if "blood" in text_lower or "hurt" in text_lower or "pain" in text_lower or "car" in text_lower:
        categories.append(EmergencyType.AMBULANCE.value)
    if "gun" in text_lower or "fight" in text_lower or "thief" in text_lower or "attack" in text_lower:
        categories.append(EmergencyType.POLICE.value)
    
    if not categories:
        categories.append(EmergencyType.GENERAL.value)

    # 2. Severity Logic
    severity = SeverityLevel.MEDIUM.value
    if "dead" in text_lower or "critical" in text_lower or "gun" in text_lower or "massive" in text_lower:
        severity = SeverityLevel.CRITICAL.value
    elif "low" in text_lower or "minor" in text_lower:
        severity = SeverityLevel.LOW.value
    elif has_media: 
        # Assume if they took a photo/video, it might be more serious
        severity = SeverityLevel.HIGH.value 

    # 3. Message Generation
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    summary = f"[{timestamp}] ALERT: {', '.join(categories)} required. Severity: {severity}. Report: {text[:50]}..."

    return {
        "detected_type": ", ".join(categories),
        "severity": severity,
        "summary_message": summary
    }

# ==========================================
# 4. API ROUTES
# ==========================================

@app.post("/report/")
async def report_emergency(
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Main entry point for Users. 
    Accepts text, location, and files. Calls AI. Saves to DB.
    """
    
    # 1. Handle File Uploads
    media_path = None
    has_media = False
    if files:
        # Save the first file found (simulated logic)
        file = files[0]
        file_location = f"uploads/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        media_path = file_location
        has_media = True

    # 2. Call AI Analysis
    ai_result = analyze_incident_with_ai(description, has_media)

    # 3. Create DB Entry
    new_incident = Incident(
        description=description,
        latitude=latitude,
        longitude=longitude,
        media_path=media_path,
        detected_type=ai_result["detected_type"],
        severity=ai_result["severity"],
        summary_message=ai_result["summary_message"],
        status=IncidentStatus.RECEIVED.value
    )
    
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    # 4. (Innovation) Trigger Priority Notification if Critical
    if new_incident.severity == SeverityLevel.CRITICAL.value:
        print(f"!!! PRIORITY ALERT TRIGGERED FOR ID {new_incident.id} !!!")

    return {
        "message": "Report received", 
        "incident_id": new_incident.id, 
        "ai_analysis": ai_result
    }

@app.websocket("/ws/status/{incident_id}")
async def websocket_endpoint(websocket: WebSocket, incident_id: int):
    """
    Real-time status connection for the User Frontend.
    """
    await manager.connect(websocket, incident_id)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, incident_id)

# --- Responder Dashboard Routes ---

@app.get("/incidents/")
def get_incidents(db: Session = Depends(get_db)):
    """
    For the Responder Dashboard. Returns all incidents.
    """
    return db.query(Incident).order_by(Incident.timestamp.desc()).all()

@app.patch("/incidents/{incident_id}/status")
async def update_status(
    incident_id: int, 
    new_status: IncidentStatus, 
    db: Session = Depends(get_db)
):
    """
    For Responders to update status (e.g., 'Team Dispatched').
    This triggers the WebSocket update to the user.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident.status = new_status.value
    db.commit()

    # INNOVATION: Real-time Push to User
    await manager.broadcast_status(incident_id, new_status.value)

    return {"message": "Status updated", "new_status": new_status.value}

# --- SMS Fallback (Innovation) ---
@app.post("/sms-fallback/")
def generate_sms_link(latitude: float, longitude: float, type: str):
    """
    Returns a link that opens the user's SMS app with a pre-filled message.
    """
    message = f"EMERGENCY! Location: https://maps.google.com/?q={latitude},{longitude}. Type: {type}. Please send help!"
    # Use 'sms:?&body=' for universal support
    return {"sms_link": f"sms:?&body={message}"}

if __name__ == "__main__":
    import uvicorn
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000)
