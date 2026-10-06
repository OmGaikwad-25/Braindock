import requests
import base64
import cv2
import os

# 1. Configuration
SERVICE_URL = "http://localhost:8000/analyze"
TEST_IMAGE_PATH = "c:/Users/Asus/Documents/BE/placement-platform/server/test_frame.jpg"

def run_test():
    print(f"--- AI DIAGNOSTIC TOOL ---")
    
    # 2. Capture a frame from the webcam (or use a file)
    print("[1/3] Capturing test frame from camera...")
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    if not ret:
        print("Error: Could not access camera.")
        return
    
    # Save frame temporarily for inspection
    cv2.imwrite(TEST_IMAGE_PATH, frame)
    cap.release()
    print(f"      Frame saved to: {TEST_IMAGE_PATH}")

    # 3. Convert to Base64
    with open(TEST_IMAGE_PATH, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    
    image_data = f"data:image/jpeg;base64,{encoded_string}"

    # 4. Send to AI Service
    print("[2/3] Sending to Python AI Service...")
    try:
        response = requests.post(SERVICE_URL, data={'image_data': image_data})
        result = response.json()
        
        # 5. Output Results
        print("[3/3] AI RESULTS:")
        if result['status'] == 'success':
            if not result['violations']:
                print("      ✅ NO VIOLATIONS DETECTED")
            else:
                for v in result['violations']:
                    print(f"      ⚠️  VIOLATION: {v['label']} [{v['id']}]")
        else:
            print(f"      ❌ ERROR: {result.get('message')}")
            
    except Exception as e:
        print(f"      ❌ CONNECTION FAILED: {e}")
        print("      (Make sure proctor_service.py is running on port 8000)")

if __name__ == "__main__":
    run_test()
