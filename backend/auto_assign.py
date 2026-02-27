
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

WEIGHTS = {
    "workload": 0.30,
    "skill_match": 0.35,
    "availability": 0.20,
    "experience": 0.15,
}

MAX_TASKS = 8

DEPARTMENT_SKILL_MAP = {
    "Electricity Department": ["Electrician", "Line Inspector", "Electrical Engineer"],
    "Water Department": ["Plumber", "Pipeline Technician", "Water Inspector"],
    "Water Resources Department": ["Plumber", "Pipeline Technician", "Water Inspector"],
    "Public Works": ["Road Contractor", "Mason", "Drainage Worker", "Civil Engineer"],
    "Public Works Department": ["Road Contractor", "Mason", "Drainage Worker", "Civil Engineer"],
    "Sanitation Department": ["Sanitation Worker", "Waste Collector", "Hygiene Inspector"],
    "Roads & Infrastructure": ["Road Contractor", "Mason", "Civil Engineer"],
    "Municipal Corporation": ["Road Contractor", "Mason", "Sanitation Worker"],
}

SKILL_LEVEL_VALUES = {"Junior": 1, "Mid": 2, "Senior": 3}

def workload_score(worker: Dict) -> float:
    active = worker.get("activeTasks", 0)
    if active >= MAX_TASKS:
        return 0
    return 1 - (active / MAX_TASKS)

def skill_match_score(worker: Dict, department: str) -> float:
    valid_roles = DEPARTMENT_SKILL_MAP.get(department, [])
    if not valid_roles:
        return 1.0 if worker.get("department") == department else 0.0
    return 1.0 if worker.get("role") in valid_roles else 0.0

def availability_score(worker: Dict) -> float:
    status = (worker.get("status") or "").lower()
    if status in ("overloaded", "inactive", "unavailable"):
        return 0.0
    return 1.0

def experience_score(worker: Dict, urgency: str) -> float:
    level_val = SKILL_LEVEL_VALUES.get(worker.get("skillLevel", "Mid"), 2)
    normalized = level_val / 3
    if urgency == "High":
        return normalized
    return 0.5 + (normalized * 0.5)

def score_worker(worker: Dict, department: str, urgency: str) -> Dict:
    wl = workload_score(worker)
    sm = skill_match_score(worker, department)
    av = availability_score(worker)
    ex = experience_score(worker, urgency)

    total = (
        WEIGHTS["workload"] * wl +
        WEIGHTS["skill_match"] * sm +
        WEIGHTS["availability"] * av +
        WEIGHTS["experience"] * ex
    )

    return {
        "total": round(total, 3),
        "breakdown": {
            "workload": round(wl * 100),
            "skill_match": round(sm * 100),
            "availability": round(av * 100),
            "experience": round(ex * 100),
        },
    }

def find_best_worker(workers: List[Dict], department: str, urgency: str) -> Optional[Dict]:
    best = None
    best_score = -1

    for w in workers:
        result = score_worker(w, department, urgency)

        if result["breakdown"]["skill_match"] == 0:
            continue
        if result["breakdown"]["availability"] == 0:
            continue

        if result["total"] > best_score:
            best_score = result["total"]
            best = {"worker": w, "score": result}

    return best

def auto_assign(workers: List[Dict], complaint: Dict) -> Dict:
    department = complaint.get("department", "")
    urgency = complaint.get("urgency", "Medium")

    if not workers:
        return {"assigned": False, "reason": "No workers in system"}

    result = find_best_worker(workers, department, urgency)

    if not result:
        return {"assigned": False, "reason": f"No available worker for {department}"}

    logger.info(
        f"✅ Auto-assigned to {result['worker'].get('name')} "
        f"(Score: {result['score']['total']})"
    )

    return {
        "assigned": True,
        "worker": result["worker"],
        "score": result["score"],
    }

