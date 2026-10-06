import uvicorn
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from ultralytics import YOLO
import base64
import io
from PIL import Image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize YOLOv8 (Upgrade to Small model for 3x higher accuracy)
try:
    print("[PROCTOR] Loading High-Level Vision Model (yolov8s)...")
    model = YOLO('yolov8s.pt') 
except Exception as e:
    print(f"YOLO Load Error: {e}")
    model = None

@app.get("/health")
async def health():
    return {"status": "ok", "yolo_ready": model is not None, "model_type": "yolov8s"}

@app.post("/analyze")
async def analyze_frame(image_data: str = Form(...)):
    try:
        # Decode Base64 image
        header, encoded = image_data.split(",", 1)
        data = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(data))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        violations = []
        
        if model:
            # Run YOLOv8 detection with better precision
            results = model(frame, verbose=False, iou=0.45, conf=0.35)[0]
            
            persons_count = 0
            print(f"--- FRAME ANALYSIS ({len(results.boxes)} objects) ---")
            
            for box in results.boxes:
                cls_id = int(box.cls[0])
                label = results.names[cls_id]
                conf = float(box.conf[0])
                
                # DIAGNOSTIC LOGGING
                print(f"[AI] Detected: {label.upper()} ({conf*100:.1f}%)")

                if label == 'person' and conf > 0.45:
                    persons_count += 1
                elif label == 'cell phone' and conf > 0.60: # Strict threshold for phones
                    violations.append({"id": "PHONE_DETECTED", "label": "Mobile phone detected (AI)", "category": "Device"})
                    print("  >> VIOLATION: Mobile Phone")
                elif label in ['headphone', 'earphone'] and conf > 0.45:
                    violations.append({"id": "EARPHONES_DETECTED", "label": "Earphones detected (AI)", "category": "Device"})
                    print("  >> VIOLATION: Earphones")

            if persons_count == 0:
                violations.append({"id": "NO_FACE", "label": "Student not in frame", "category": "Face"})
            elif persons_count > 1:
                violations.append({"id": "MULTIPLE_FACES", "label": "Multiple people detected", "category": "Face"})
            
        return {"status": "success", "violations": violations}

    except Exception as e:
        print(f"Server Error: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
