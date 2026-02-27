import './Footer.css';
export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    <div className="footer-section">
                        <h4 className="footer-heading">About समस्या SATHI</h4>
                        <p className="footer-text">
                            समस्या SATHI — AI-Powered Public Grievance Redressal System — enabling transparent,
                            efficient, and accountable governance through technology.
                        </p>
                    </div>
                    <div className="footer-section">
                        <h4 className="footer-heading">Quick Links</h4>
                        <ul className="footer-links">
                            <li><a href="#about">About</a></li>
                            <li><a href="#features">Features</a></li>
                            <li><a href="#contact">Contact</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4 className="footer-heading">Legal</h4>
                        <ul className="footer-links">
                            <li><a href="#privacy">Privacy Policy</a></li>
                            <li><a href="#terms">Terms of Service</a></li>
                            <li><a href="#access">Accessibility</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4 className="footer-heading">Contact</h4>
                        <ul className="footer-links">
                            <li>📧 support@samasyasathi.gov.in</li>
                            <li>📞 1800-111-5555</li>
                            <li>📍 New Delhi, India</li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 समस्या SATHI — Government of India. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
