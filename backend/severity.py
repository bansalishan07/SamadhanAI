def calculate_severity(detections):
    if not detections:
        return {
            "detected_hazard": "none",
            "severity_score": 2,
            "priority_level": "Low",
            "confidence": 0.0,
            "description": "No hazard detected in the image"
        }

    HAZARD_PRIORITY = ["fire", "exposed_wire", "pothole", "water_leak", "garbage"]

    def sort_key(d):
        cls = d["class_name"]
        priority_idx = HAZARD_PRIORITY.index(cls) if cls in HAZARD_PRIORITY else 99
        return (priority_idx, -d["confidence"])

    sorted_dets = sorted(detections, key=sort_key)
    top = sorted_dets[0]

    hazard = top["class_name"]
    conf = top["confidence"]
    area = top.get("bbox_area", 0.0)

    if hazard == "fire":
        score = 10
    elif hazard == "exposed_wire":
        score = 9 if conf > 0.75 else 7
    elif hazard == "pothole":
        score = 8 if area > 0.05 else 6
    elif hazard == "water_leak":
        score = 6
    elif hazard == "garbage":
        score = 4
    else:
        score = 2

    if score >= 8:
        priority = "Critical"
    elif score >= 5:
        priority = "High"
    elif score >= 3:
        priority = "Medium"
    else:
        priority = "Low"

    DESCRIPTIONS = {
        "fire": "🔥 Fire detected — immediate action required!",
        "exposed_wire": "⚡ Exposed electrical wiring — electrocution risk!",
        "pothole": "🕳️ Pothole detected — road safety hazard",
        "water_leak": "💧 Water leakage detected — infrastructure issue",
        "garbage": "🗑️ Garbage accumulation detected — sanitation issue",
    }

    return {
        "detected_hazard": hazard,
        "severity_score": score,
        "priority_level": priority,
        "confidence": round(conf, 2),
        "description": DESCRIPTIONS.get(hazard, "Hazard detected"),
        "all_detections": [
            {"hazard": d["class_name"], "confidence": round(d["confidence"], 2)}
            for d in sorted_dets[:5]
        ]
    }

def severity_to_urgency(priority_level):
    mapping = {
        "Critical": "High",
        "High": "High",
        "Medium": "Medium",
        "Low": "Low"
    }
    return mapping.get(priority_level, "Medium")

