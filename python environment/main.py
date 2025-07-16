from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import face_recognition
import numpy as np
import cv2
import os
import json

app = FastAPI()

# Directory to store encodings
ENCODINGS_PATH = "encodings.json"

def load_encodings():
    if os.path.exists(ENCODINGS_PATH):
        with open(ENCODINGS_PATH, "r") as f:
            return json.load(f)
    return {}

def save_encodings(encodings):
    with open(ENCODINGS_PATH, "w") as f:
        json.dump(encodings, f)

@app.post("/register-face")
async def register_face(user_id: str = Form(...), file: UploadFile = File(...)):
    image = await file.read()
    np_img = np.frombuffer(image, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    face_locations = face_recognition.face_locations(img)
    if len(face_locations) != 1:
        return JSONResponse({"success": False, "msg": "No face or multiple faces detected."}, status_code=400)
    face_encoding = face_recognition.face_encodings(img, face_locations)[0].tolist()
    encodings = load_encodings()
    encodings[user_id] = face_encoding
    save_encodings(encodings)
    return {"success": True, "msg": "Face registered.", "encoding": face_encoding}

@app.post("/verify-face")
async def verify_face(file: UploadFile = File(...)):
    image = await file.read()
    np_img = np.frombuffer(image, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    face_locations = face_recognition.face_locations(img)
    if len(face_locations) != 1:
        return JSONResponse({"success": False, "msg": "No face or multiple faces detected."}, status_code=400)
    face_encoding = face_recognition.face_encodings(img, face_locations)[0]
    encodings = load_encodings()
    for user_id, stored_encoding in encodings.items():
        match = face_recognition.compare_faces([np.array(stored_encoding)], face_encoding)[0]
        if match:
            return {"success": True, "user_id": user_id}
    return {"success": False, "msg": "No match found."}