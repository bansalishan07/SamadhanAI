import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getAllComplaints } from '../../../services/firebaseComplaintService';
import Card from '../../../components/Card/Card';
import Badge from '../../../components/Badge/Badge';
import Spinner from '../../../components/Spinner/Spinner';
import { HiOutlineGlobe, HiOutlineExclamationCircle, HiOutlineLightningBolt, HiOutlineShieldCheck } from 'react-icons/hi';
import './GeoIntelligence.css';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
const CLUSTER_API = 'http://localhost:8000/api/analyze-clusters';
export default function GeoIntelligence() {
    const [complaints, setComplaints] = useState([]);
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalZones: 0, criticalZones: 0, avgRisk: 'Low' });
    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getAllComplaints();
                setComplaints(data);
                const res = await fetch(CLUSTER_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (res.ok) {
                    const clusterData = await res.json();
                    setClusters(clusterData);
                    const critical = clusterData.filter(c => c.risk_level === 'Critical').length;
                    setStats({
                        totalZones: clusterData.length,
                        criticalZones: critical,
                        avgRisk: clusterData.length > 0 ? (critical > 0 ? 'Critical' : 'High') : 'Low'
                    });
                }
            } catch (err) {
                console.error('Failed to fetch geo-intelligence data:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);
    const getRiskColor = (level) => {
        switch (level) {
            case 'Critical': return '#dc2626';
            case 'High': return '#f97316';
            case 'Medium': return '#facc15';
            case 'Low': return '#22c55e';
            default: return '#64748b';
        }
    };
    if (loading) return <Spinner text="Initializing Smart City Intelligence..." />;
    return (
        <div className="geo-intel-container">
            <div className="page-header">
                <h1 className="page-title">Geo-Cluster Intelligence</h1>
                <p className="page-subtitle">Real-time Urban Risk Hotspot Detection & Geospatial Analysis</p>
            </div>
            <div className="intel-grid">
                <Card icon={<HiOutlineGlobe />} value={stats.totalZones} label="Active Risk Zones" color="blue" />
                <Card icon={<HiOutlineExclamationCircle />} value={stats.criticalZones} label="Critical Hotspots" color="red" />
                <Card icon={<HiOutlineLightningBolt />} value={stats.avgRisk} label="System Risk Status" color="yellow" />
                <Card icon={<HiOutlineShieldCheck />} value={`${Math.round((clusters.length / (complaints.length || 1)) * 100)}%`} label="Incident Clustering" color="green" />
            </div>
            <div className="map-section-card">
                <div className="map-header">
                    <h3>Smart City Risk Visualization</h3>
                    <div className="map-legend">
                        <span className="legend-item"><span className="dot critical"></span> Critical</span>
                        <span className="legend-item"><span className="dot high"></span> High</span>
                        <span className="legend-item"><span className="dot medium"></span> Medium</span>
                    </div>
                </div>
                <div className="map-wrapper">
                    <MapContainer center={[28.4595, 77.0266]} zoom={13} style={{ height: '600px', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {clusters.map((cluster) => (
                            <Circle
                                key={cluster.id}
                                center={[cluster.lat, cluster.lng]}
                                radius={400} 
                                pathOptions={{
                                    color: getRiskColor(cluster.risk_level),
                                    fillColor: getRiskColor(cluster.risk_level),
                                    fillOpacity: 0.35,
                                    weight: 2
                                }}
                            >
                                <Popup className="custom-popup">
                                    <div className="popup-content">
                                        <Badge type={cluster.risk_level.toLowerCase()}>{cluster.risk_level} Risk Zone</Badge>
                                        <h4>{cluster.area} Hotspot</h4>
                                        <p><strong>Incidents:</strong> {cluster.size}</p>
                                        <p><strong>Avg Severity:</strong> {cluster.avg_severity}/10</p>
                                        <div className="category-mix">
                                            {Object.entries(cluster.categories).map(([cat, count]) => (
                                                <span key={cat} className="cat-pill">{cat}: {count}</span>
                                            ))}
                                        </div>
                                    </div>
                                </Popup>
                            </Circle>
                        ))}
                        {}
                        {complaints.filter(c => c.lat && c.lng).map((c, idx) => (
                            <Circle
                                key={`c-${idx}`}
                                center={[c.lat, c.lng]}
                                radius={20}
                                pathOptions={{ color: '#64748b', fillOpacity: 0.5, weight: 1 }}
                            />
                        ))}
                    </MapContainer>
                </div>
            </div>
            <div className="hotspots-list">
                <h2 className="section-title">Detected Risk Zones</h2>
                <div className="hotspot-grid">
                    {clusters.sort((a, b) => b.size - a.size).map(cluster => (
                        <div key={cluster.id} className="hotspot-card" style={{ borderLeftColor: getRiskColor(cluster.risk_level) }}>
                            <div className="hotspot-header">
                                <h4>{cluster.area}</h4>
                                <Badge type={cluster.risk_level.toLowerCase()}>{cluster.risk_level}</Badge>
                            </div>
                            <div className="hotspot-body">
                                <p>Concentration of <strong>{cluster.size} complaints</strong> detected in this radius.</p>
                                <div className="hotspot-stats">
                                    <span>Avg Severity: {cluster.avg_severity}</span>
                                    <span>Main Issue: {Object.keys(cluster.categories)[0]}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {clusters.length === 0 && <p className="empty-msg">No high-density incident clusters detected yet. System is scanning...</p>}
                </div>
            </div>
        </div>
    );
}
