import cv2
import mediapipe as mp
import pyautogui
import threading
import time
import asyncio
import numpy as np
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import base64
import os
import signal
import sys
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

app = FastAPI()

# Setup MediaPipe
mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Inisialisasi Kamera
cap = cv2.VideoCapture(1)
if not cap.isOpened():
    logging.info("Error: Could not open webcam. Trying index 0...")
    cap = cv2.VideoCapture(0)
if not cap.isOpened():
    logging.error("Error: Could not open any webcam. Please check your camera.")
    exit()

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)  # Atur frame rate

# Variabel global
frame = None
lock = threading.Lock()
result = None
current_action = "No Action"
last_press_time = time.time()
press_interval = 0.2

# Fungsi utama untuk memproses frame
def process_frames():
    global frame, result, current_action, last_press_time
    while cap.isOpened():
        ret, temp_frame = cap.read()
        if not ret:
            logging.error("Error: Failed to capture frame from webcam.")
            time.sleep(0.1)
            continue
        
        temp_frame = cv2.flip(temp_frame, 1)
        with lock:
            frame = temp_frame
        
        # Deteksi tangan
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = hands.process(rgb_frame)
        except Exception as e:
            logging.error(f"Error processing frame with MediaPipe: {e}")
            result = None
            continue

        # Kontrol game
        if result and result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                x, y = int(hand_landmarks.landmark[8].x * 640), int(hand_landmarks.landmark[8].y * 480)
                current_time = time.time()
                if (current_time - last_press_time) > press_interval:
                    if x < 200:
                        pyautogui.keyDown("left")
                        pyautogui.keyUp("right")
                        pyautogui.keyUp("up")
                        pyautogui.keyUp("down")
                        current_action = "Move Left ⬅️"
                    elif x > 400:
                        pyautogui.keyDown("right")
                        pyautogui.keyUp("left")
                        pyautogui.keyUp("up")
                        pyautogui.keyUp("down")
                        current_action = "Move Right ➡️"
                    elif y < 150:
                        pyautogui.keyDown("up")
                        pyautogui.keyUp("left")
                        pyautogui.keyUp("right")
                        pyautogui.keyUp("down")
                        current_action = "Move Up ⬆️"
                    elif y > 350:
                        pyautogui.keyDown("down")
                        pyautogui.keyUp("left")
                        pyautogui.keyUp("right")
                        pyautogui.keyUp("up")
                        current_action = "Move Down ⬇️"
                    else:
                        pyautogui.keyUp("left")
                        pyautogui.keyUp("right")
                        pyautogui.keyUp("up")
                        pyautogui.keyUp("down")
                        current_action = "No Action"
                    last_press_time = current_time
        else:
            pyautogui.keyUp("left")
            pyautogui.keyUp("right")
            pyautogui.keyUp("up")
            pyautogui.keyUp("down")
            current_action = "No Action"
        
        time.sleep(0.01)  # Delay kecil untuk stabilitas

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    logging.info("WebSocket client connected.")
    await websocket.accept()
    threading.Thread(target=process_frames, daemon=True).start()

    while cap.isOpened():
        with lock:
            if frame is None:
                await asyncio.sleep(0.03)
                continue
            process_frame = frame.copy()

        if result and result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                mp_draw.draw_landmarks(process_frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

        cv2.putText(process_frame, f"Action: {current_action}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        try:
            _, buffer = cv2.imencode('.jpg', process_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
        except Exception as e:
            logging.error(f"Error encoding frame to base64: {e}")
            await asyncio.sleep(0.03)
            continue

        await websocket.send_text(f"frame:data:image/jpeg;base64,{frame_base64}")
        await websocket.send_text(f"action:{current_action}")
        await asyncio.sleep(0.03)

    cap.release()
    logging.info("WebSocket client disconnected.")
    await websocket.close()

# Endpoint untuk halaman HTML
@app.get("/", response_class=HTMLResponse)
async def get_motor_page():
    folder_path = "/computervision-game"
    html_content = ""
    
    try:
        for filename in os.listdir(folder_path):
            if filename.endswith(".html"):
                file_path = os.path.join(folder_path, filename)
                with open(file_path, "r") as f:
                    html_content += f.read() + "\n"
    except FileNotFoundError:
        logging.error("Directory not found")
        return HTMLResponse(content="<h1>Error: Directory not found</h1>")
    except Exception as e:
        logging.error(f"Error reading files: {str(e)}")
        return HTMLResponse(content=f"<h1>Error: {str(e)}</h1>")

    return HTMLResponse(content=html_content)

# Penanganan shutdown
def signal_handler(sig, frame):
    logging.info("Cleaning up...")
    if cap.isOpened():
        cap.release()
    hands.close()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

if __name__ == "__main__":
    try:
        import uvicorn
        logging.info("Starting FastAPI server on 192.168.1.9:8000...")
        uvicorn.run(app, host="192.168.1.9", port=8000)
    except KeyboardInterrupt:
        signal_handler(None, None)
    except Exception as e:
        logging.error(f"Server error: {e}")
        signal_handler(None, None)