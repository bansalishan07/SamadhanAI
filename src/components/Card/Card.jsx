import './Card.css';
export default function Card({ icon, value, label, color = 'blue', className = '' }) {
    return (
        <div className={`stat-card stat-card-${color} ${className}`}>
            <div className="stat-card-icon">{icon}</div>
            <div className="stat-card-content">
                <span className="stat-card-value">{value}</span>
                <span className="stat-card-label">{label}</span>
            </div>
        </div>
    );
}
