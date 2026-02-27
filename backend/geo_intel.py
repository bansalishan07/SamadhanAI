import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from typing import List, Dict

def cluster_complaints(complaints: List[Dict]) -> List[Dict]:
    if not complaints or len(complaints) < 2:
        return []

    df = pd.DataFrame(complaints)
    
    if 'lat' not in df.columns or 'lng' not in df.columns:
        return []

    coords = df[['lat', 'lng']].values
    db = DBSCAN(eps=0.002, min_samples=3).fit(coords)
    df['cluster_id'] = db.labels_

    results = []
    clusters = df[df['cluster_id'] != -1]

    for cluster_id in clusters['cluster_id'].unique():
        cluster_data = clusters[clusters['cluster_id'] == cluster_id]
        
        center_lat = cluster_data['lat'].mean()
        center_lng = cluster_data['lng'].mean()
        size = len(cluster_data)
        
        avg_severity = 5
        if 'imageSeverity' in cluster_data.columns:
            severities = cluster_data['imageSeverity'].apply(lambda x: x.get('severityScore', 5) if isinstance(x, dict) else 5)
            avg_severity = severities.mean()
        elif 'urgency' in cluster_data.columns:
             urgency_map = {'Critical': 10, 'High': 7, 'Medium:': 5, 'Low': 3}
             avg_severity = cluster_data['urgency'].map(urgency_map).fillna(5).mean()

        risk_level = "Low"
        if size > 10 and avg_severity > 7:
            risk_level = "Critical"
        elif size > 6 and avg_severity > 5:
            risk_level = "High"
        elif size > 3:
            risk_level = "Medium"

        categories = cluster_data['category'].value_counts().to_dict()

        results.append({
            "id": int(cluster_id),
            "lat": float(center_lat),
            "lng": float(center_lng),
            "size": int(size),
            "avg_severity": round(float(avg_severity), 1),
            "risk_level": risk_level,
            "categories": categories,
            "area": cluster_data['location'].mode()[0] if not cluster_data['location'].empty else "Unknown"
        })

    return results

