
import io
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import logging

# Optional ML dependencies — may not be available on all systems
try:
    from PIL import Image
    from severity import calculate_severity, severity_to_urgency
    from geo_intel import cluster_complaints
    ML_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ ML modules not available ({e}). Image analysis & geo-intel disabled.")
    ML_AVAILABLE = False


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="समस्या SATHI — AI Severity API",
    description="Analyzes uploaded images for public hazards using YOLOv8",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COCO_TO_HAZARD = {
    "fire hydrant": "water_leak",
    "toilet": "sanitation",
    "sink": "water_leak",
}

model = None

def get_model():
    global model
    if model is None:
        try:
            from ultralytics import YOLO
            model_path = os.environ.get("YOLO_MODEL", "yolov8n.pt")
            model = YOLO(model_path)
            print(f"✅ YOLO model loaded: {model_path}")
        except Exception as e:
            print(f"⚠️ YOLO load failed: {e}. Using fallback analysis.")
            model = "fallback"
    return model

def analyze_with_yolo(image: Image.Image):
    mdl = get_model()

    if mdl == "fallback":
        return fallback_analysis(image)

    try:
        results = mdl(image, verbose=False)
        detections = []

        for result in results:
            if result.boxes is None:
                continue
            img_area = image.width * image.height

            for box in result.boxes:
                cls_id = int(box.cls[0])
                cls_name = mdl.names[cls_id]
                conf = float(box.conf[0])

                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox_area = ((x2 - x1) * (y2 - y1)) / img_area

                hazard = map_to_hazard(cls_name, conf, bbox_area)
                if hazard:
                    detections.append({
                        "class_name": hazard,
                        "confidence": conf,
                        "bbox_area": bbox_area,
                        "original_class": cls_name,
                    })

        if not detections:
            return fallback_analysis(image)

        return detections

    except Exception as e:
        print(f"YOLO inference error: {e}")
        return fallback_analysis(image)

def map_to_hazard(coco_class: str, confidence: float, bbox_area: float):
    coco_class = coco_class.lower()

    if coco_class in ["oven", "microwave", "toaster"]:
        return "fire"
    if coco_class in ["fire hydrant"]:
        return "water_leak"
    if coco_class in ["toilet", "sink"]:
        return "water_leak"

    if coco_class in ["bottle", "cup", "bowl", "banana", "apple", "sandwich",
                       "orange", "pizza", "cake", "handbag", "backpack", "suitcase"]:
        if bbox_area > 0.02:
            return "garbage"

    return None

def fallback_analysis(image: Image.Image):
    import numpy as np

    img_array = np.array(image.resize((100, 100)))
    avg_color = img_array.mean(axis=(0, 1))

    r, g, b = avg_color[0], avg_color[1], avg_color[2]

    if r > 150 and r > g * 1.3 and r > b * 1.5:
        return [{"class_name": "fire", "confidence": 0.65, "bbox_area": 0.3}]

    if b > 130 and b > r * 1.2 and b > g * 1.1:
        return [{"class_name": "water_leak", "confidence": 0.55, "bbox_area": 0.2}]

    if r < 80 and g < 80 and b < 80:
        return [{"class_name": "pothole", "confidence": 0.50, "bbox_area": 0.15}]

    if r > 100 and g > 70 and g < 140 and b < 80:
        return [{"class_name": "garbage", "confidence": 0.50, "bbox_area": 0.2}]

    if r > 150 and g > 130 and b < 80:
        return [{"class_name": "exposed_wire", "confidence": 0.45, "bbox_area": 0.1}]

    return [{"class_name": "pothole", "confidence": 0.40, "bbox_area": 0.1}]

@app.get("/")
async def health():
    return {"status": "ok", "service": "समस्या SATHI AI Severity API"}

@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG)")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not process image file")

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    detections = analyze_with_yolo(image)

    result = calculate_severity(detections)

    result["urgency"] = severity_to_urgency(result["priority_level"])

    return result

@app.post("/api/analyze-image/mock")
async def analyze_image_mock(file: UploadFile = File(...)):
    import random

    hazards = [
        {"class_name": "pothole", "confidence": 0.88, "bbox_area": 0.06},
        {"class_name": "fire", "confidence": 0.92, "bbox_area": 0.15},
        {"class_name": "exposed_wire", "confidence": 0.81, "bbox_area": 0.04},
        {"class_name": "water_leak", "confidence": 0.76, "bbox_area": 0.08},
        {"class_name": "garbage", "confidence": 0.85, "bbox_area": 0.20},
    ]

    detection = random.choice(hazards)
    result = calculate_severity([detection])
    result["urgency"] = severity_to_urgency(result["priority_level"])
    return result

@app.post("/api/analyze-clusters")
async def analyze_clusters(complaints: List[Dict]):
    try:
        if not complaints:
            return []
        
        clusters = cluster_complaints(complaints)
        logger.info(f"Generated {len(clusters)} clusters from {len(complaints)} complaints")
        return clusters
    except Exception as e:
        logger.error(f"Clustering error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

try:
    from auto_assign import auto_assign, score_worker
    AUTO_ASSIGN_AVAILABLE = True
except ImportError:
    AUTO_ASSIGN_AVAILABLE = False
    print("⚠️ auto_assign module not available.")

@app.post("/api/auto-assign")
async def api_auto_assign(data: Dict):
    try:
        workers = data.get("workers", [])
        complaint = data.get("complaint", {})
        if not complaint.get("department"):
            raise HTTPException(status_code=400, detail="Complaint must include 'department'")
        result = auto_assign(workers, complaint)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auto-assign error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/score-workers")
async def api_score_workers(data: Dict):
    workers = data.get("workers", [])
    department = data.get("department", "")
    urgency = data.get("urgency", "Medium")
    
    scored = []
    for w in workers:
        s = score_worker(w, department, urgency)
        scored.append({"worker": w.get("name", "Unknown"), "role": w.get("role", ""), "score": s})
    
    scored.sort(key=lambda x: x["score"]["total"], reverse=True)
    return scored

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
