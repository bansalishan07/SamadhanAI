import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { HiOutlineLightningBolt, HiOutlineEye, HiOutlineOfficeBuilding, HiOutlineChartBar } from 'react-icons/hi';
import './Landing.css';
const features = [
    {
        icon: <HiOutlineLightningBolt size={28} />,
        title: 'AI-Based Classification',
        description: 'Automatically categorize complaints using advanced natural language processing and machine learning algorithms.',
    },
    {
        icon: <HiOutlineEye size={28} />,
        title: 'Real-Time Tracking',
        description: 'Track your complaint status in real-time with transparent updates at every stage of resolution.',
    },
    {
        icon: <HiOutlineOfficeBuilding size={28} />,
        title: 'Department Auto-Routing',
        description: 'Complaints are intelligently routed to the right government department for faster resolution.',
    },
    {
        icon: <HiOutlineChartBar size={28} />,
        title: 'Transparency & Analytics',
        description: 'Comprehensive analytics and dashboards ensure accountability and data-driven governance.',
    },
];
const stats = [
    { value: '50,000+', label: 'Complaints Resolved' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '24hrs', label: 'Avg Response Time' },
    { value: '120+', label: 'Departments Connected' },
];
export default function Landing() {
    return (
        <div className="landing-page">
            <Navbar />
            {}
            <section className="hero">
                <div className="hero-bg-pattern" />
                <div className="hero-container">
                    <div className="hero-content animate-fade-in">
                        <div className="hero-badge">🇮🇳 Government of India Initiative</div>
                        <h1 className="hero-title">
                            AI-Powered Public <br />
                            <span className="hero-title-accent">समस्या SATHI</span>
                        </h1>
                        <p className="hero-subtitle">
                            Automatically classify, prioritize, and route citizen complaints using AI.
                            A transparent, efficient, and accountable governance platform.
                        </p>
                        <div className="hero-actions">
                            <Link to="/register" className="hero-btn hero-btn-primary">
                                Register Complaint
                                <span className="hero-btn-arrow">→</span>
                            </Link>
                            <Link to="/login" className="hero-btn hero-btn-secondary">
                                Login to Portal
                            </Link>
                        </div>
                    </div>
                    <div className="hero-visual animate-slide-up">
                        <div className="hero-card">
                            <div className="hero-card-header">
                                <div className="hero-card-dot" />
                                <div className="hero-card-dot" />
                                <div className="hero-card-dot" />
                            </div>
                            <div className="hero-card-body">
                                <div className="hero-card-line hero-card-line-title" />
                                <div className="hero-card-line hero-card-line-text" />
                                <div className="hero-card-line hero-card-line-text short" />
                                <div className="hero-card-tags">
                                    <span className="hero-tag hero-tag-blue">AI Classified</span>
                                    <span className="hero-tag hero-tag-green">Auto-Routed</span>
                                    <span className="hero-tag hero-tag-red">High Priority</span>
                                </div>
                                <div className="hero-card-progress">
                                    <div className="hero-progress-bar" />
                                </div>
                                <div className="hero-card-line hero-card-line-text" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {}
            <section className="stats-section">
                <div className="stats-container">
                    {stats.map((stat) => (
                        <div key={stat.label} className="stat-item">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </section>
            {}
            <section className="features-section" id="features">
                <div className="features-container">
                    <div className="features-header">
                        <span className="features-badge">Features</span>
                        <h2 className="features-title">Powered by Cutting-Edge AI</h2>
                        <p className="features-subtitle">
                            Our platform leverages artificial intelligence to transform how citizen grievances
                            are handled, ensuring faster resolution and greater accountability.
                        </p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature, i) => (
                            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="feature-icon">{feature.icon}</div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {}
            <section className="cta-section">
                <div className="cta-container">
                    <h2 className="cta-title">Ready to file a complaint?</h2>
                    <p className="cta-subtitle">Join thousands of citizens who have already used our platform for faster grievance resolution.</p>
                    <Link to="/register" className="cta-btn">Get Started Free →</Link>
                </div>
            </section>
            <Footer />
        </div>
    );
}
