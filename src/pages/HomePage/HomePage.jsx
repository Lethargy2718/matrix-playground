import { useNavigate } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="home-page container">
            <div className="home-hero">
                <div className="home-hero-content">
                    <div className="left">
                        <p className="home-eyebrow">Linear Algebra, step by step</p>
                        <h1 className="home-title">
                            Matrix<br />Playground
                        </h1>
                        <p className="home-subtitle">
                            Solve systems of equations and watch every row operation unfold, or just describe your problem in plain English and let the AI handle the setup.
                        </p>
                    </div>
                    <div className="home-cta-group">
                        <button
                            className="home-cta home-cta--primary"
                            onClick={() => navigate('/ai')}
                        >
                            <span className="home-cta-icon">✦</span>
                            <div>
                                <div className="home-cta-label">Ask the AI</div>
                                <div className="home-cta-desc">Describe a circuit, word problem, or system — the AI builds the matrix for you</div>
                            </div>
                            <span className="home-cta-arrow">→</span>
                        </button>

                        <button
                            className="home-cta home-cta--secondary"
                            onClick={() => navigate('/playground')}
                        >
                            <span className="home-cta-icon">⊞</span>
                            <div>
                                <div className="home-cta-label">Matrix Playground</div>
                                <div className="home-cta-desc">Enter values directly and step through REF, RREF, or solve the full system</div>
                            </div>
                            <span className="home-cta-arrow">→</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}