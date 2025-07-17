from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from typing import Dict, List
import face_recognition
import numpy as np
import cv2
import json

app = FastAPI()

# In-memory session cache: {session_id: [ {user_id, encoding}, ... ]}
session_encodings: Dict[str, List[dict]] = {}

@app.post("/register-face")
async def register_face(user_id: str = Form(...), file: UploadFile = File(...)):
    image = await file.read()
    np_img = np.frombuffer(image, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    face_locations = face_recognition.face_locations(img)
    if len(face_locations) != 1:
        return JSONResponse({"success": False, "msg": "No face or multiple faces detected."}, status_code=400)
    face_encoding = face_recognition.face_encodings(img, face_locations)[0].tolist()
    return {"success": True, "msg": "Face registered.", "encoding": face_encoding}

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
    face_locations = face_recognition.face_locations(img)
    if len(face_locations) != 1:
        return JSONResponse({"success": False, "msg": "No face or multiple faces detected."}, status_code=400)
    face_encoding = face_recognition.face_encodings(img, face_locations)[0]
    for entry in session_encodings[session_id]:
        user_id = entry.get("user_id")
        stored_encoding = np.array(entry.get("encoding"))
        match = face_recognition.compare_faces([stored_encoding], face_encoding, tolerance=0.7)[0]
        if match:
            return {"success": True, "user_id": user_id}
    return {"success": False, "msg": "No match found."}

@app.post("/end-verify-session")
async def end_verify_session(session_id: str = Form(...)):
    if session_id in session_encodings:
        del session_encodings[session_id]
        return {"success": True, "msg": "Session ended."}
    return JSONResponse({"success": False, "msg": "Session not found."}, status_code=404)