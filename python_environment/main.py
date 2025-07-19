from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from typing import Dict, List
import face_recognition
import numpy as np
import cv2
import json

app = FastAPI()
#hello from python

# In-memory session cache: {session_id: [ {user_id, encodings}, ... ]}
session_encodings: Dict[str, List[dict]] = {}

def preprocess_image(img):
    # Convert to grayscale for histogram equalization
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    eq = cv2.equalizeHist(gray)
    eq_bgr = cv2.cvtColor(eq, cv2.COLOR_GRAY2BGR)
    # Placeholder for face alignment (can be added here)
    return eq_bgr

@app.post("/register-face")
async def register_face(user_id: str = Form(...), file: UploadFile = File(...)):
    try:
        image = await file.read()
        np_img = np.frombuffer(image, np.uint8)
        img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        if img is None:
            return JSONResponse({"success": False, "msg": "Invalid or corrupted image."}, status_code=400)
        img = preprocess_image(img)
        face_locations = face_recognition.face_locations(img)
        if len(face_locations) != 1:
            return JSONResponse({"success": False, "msg": "No face or multiple faces detected."}, status_code=400)
        encodings = face_recognition.face_encodings(img, face_locations)
        if not encodings or len(encodings[0]) != 128:
            return JSONResponse({"success": False, "msg": "Failed to extract face encoding."}, status_code=400)
        face_encoding = encodings[0].tolist()
        return {"success": True, "msg": "Face registered.", "encoding": face_encoding}
    except Exception as e:
        return JSONResponse({"success": False, "msg": f"Server error: {str(e)}"}, status_code=500)

@app.post("/start-verify-session")
async def start_verify_session(session_id: str = Form(...), encodings: UploadFile = File(...)):
    encodings_json = await encodings.read()
    try:
        encodings_list = json.loads(encodings_json)
        session_encodings[session_id] = encodings_list
        return {"success": True, "msg": "Session started."}
    except Exception as e:
        return JSONResponse({"success": False, "msg": f"Invalid encodings format: {e}"}, status_code=400)

@app.post("/verify-frame")
async def verify_frame(session_id: str = Form(...), file: UploadFile = File(...)):
    if session_id not in session_encodings:
        return JSONResponse({"success": False, "msg": "Session not found."}, status_code=404)
    image = await file.read()
    np_img = np.frombuffer(image, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    img = preprocess_image(img)  # Consistent preprocessing
    face_locations = face_recognition.face_locations(img)
    if len(face_locations) != 1:
        return JSONResponse({"success": False, "msg": "No face or multiple faces detected."}, status_code=400)
    face_encoding = face_recognition.face_encodings(img, face_locations)[0]
    best_user_id = None
    best_distance = 1.0
    TOLERANCE = 0.55  # Stage 1: strict threshold
    SECONDARY_TOLERANCE = 0.48  # Stage 2: even stricter (optional)
    # Multistage verification: 1) strict distance, 2) (optional) secondary check
    for entry in session_encodings[session_id]:
        user_id = entry.get("user_id")
        user_encodings = entry.get("encodings", [])
        if not user_encodings:
            continue
        arr = np.array(user_encodings)
        distances = face_recognition.face_distance(arr, face_encoding)
        min_distance = float(np.min(distances))
        # Stage 1: strict threshold
        if min_distance < TOLERANCE and min_distance < best_distance:
            # Stage 2: placeholder for liveness/extra check (could add here)
            if min_distance < SECONDARY_TOLERANCE:
                best_distance = min_distance
                best_user_id = user_id
    if best_user_id:
        return {"success": True, "user_id": best_user_id}
    return {"success": False, "msg": "No match found."}

@app.post("/end-verify-session")
async def end_verify_session(session_id: str = Form(...)):
    if session_id in session_encodings:
        del session_encodings[session_id]
        return {"success": True, "msg": "Session ended."}
    return JSONResponse({"success": False, "msg": "Session not found."}, status_code=404)