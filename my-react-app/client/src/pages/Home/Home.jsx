// src/pages/Home.jsx - EXACT MATCH to your screenshots
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Link } from 'react-router-dom';  // ← ADD THIS LINE
import './Home.css';

// Your existing code...


const Home = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
      {/* SNOWFALL CONTAINER */}
      <div className="snow-container">
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
        <div className="snowflake">❄️</div>
      </div>

            {/* Header */}
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <div className="logo">
                            {/* <div className="logo-icon">
                                <span className="mountain">⛰️</span>
                                
                            </div> */}
                            <h1>🛡<span className="highlight">Kavach</span></h1>
                        </div>
                        <button 
                            className="mobile-menu-toggle" 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? '✕' : '☰'}
                        </button>
                        <nav className={`nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                            <a href="#hazards" onClick={() => setIsMobileMenuOpen(false)}>Hazards</a>
                            <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
                            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How It Works</a>
                            <button className="btn-primary btn-sm nav-btn-mobile" onClick={() => navigate('/login')}>
                                Try Now
                            </button>
                        </nav>
                        <button className="btn-primary btn-sm btn-desktop" onClick={() => navigate('/login')}>
  Try Now
</button>

                    </div>
                </div>
            </header>

            {/* Hero Section */}

            <section className="hero">
                <div className="hero-bg"></div>
                <div className="hero-glow"></div>

                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <div className="status-dot"></div>
                            <span>AI-Powered Risk Forecasting</span>
                        </div>

                        <h1 className="hero-title">
                            Multi-Hazard <span className="gradient-text">Risk Forecast</span><br />
                            <span className="hero-subtitle">for Mountain Regions</span>
                        </h1>

                        <p className="hero-text">
                            Forecast risk levels for landslides, flash floods, and avalanches using
                            real geophysical and climate data. Stay prepared, not surprised.
                        </p>

                        <div className="hero-buttons">
                            <Link to="/login" className="btn-hero-primary">
  Try Now
</Link>

                            <button className="btn-hero-secondary">Learn More</button>
                        </div>

                        
                        
                    </div>
                </div>
            </section>


            {/* Hazards Section */}
            <section id="hazards" className="section hazards">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Hazard Coverage</span>
                        <h2 className="section-title">What We Monitor</h2>
                        <p className="section-text">
                            We focus on forecasting <strong>risk levels</strong>, not predicting the unpredictable.
                            Our approach is scientifically grounded and actionable.
                        </p>
                    </div>
                    <div className="hazards-grid">
                        <div className="hazard-card">
                            <div className="card-header">
                                <div className="icon-wrapper">
                                    <span className="icon">⛰️</span>
                                </div>
                                <div className="status predictable">✓ Forecastable</div>
                            </div>
                            <h3>Landslides</h3>
                            <p>Monitor slope stability, soil saturation, and seismic activity for accurate risk forecasting.</p>
                            <div className="card-stats">
                                <div className="stat">
                                    <span>Predictability</span>
                                    <strong>High (risk-based)</strong>
                                </div>
                                <div className="stat">
                                    <span>Feasibility</span>
                                    <div className="stars">★★★★★</div>
                                </div>
                            </div>
                        </div>
                        <div className="hazard-card">
                            <div className="card-header">
                                <div className="icon-wrapper">
                                    <span className="icon">💧</span>
                                </div>
                                <div className="status predictable">✓ Forecastable</div>
                            </div>
                            <h3>Flash Floods</h3>
                            <p>Track precipitation patterns, river levels, and drainage capacity in real-time.</p>
                            <div className="card-stats">
                                <div className="stat">
                                    <span>Predictability</span>
                                    <strong>Medium-High</strong>
                                </div>
                                <div className="stat">
                                    <span>Feasibility</span>
                                    <div className="stars">★★★★☆</div>
                                </div>
                            </div>
                        </div>
                        <div className="hazard-card">
                            <div className="card-header">
                                <div className="icon-wrapper">
                                    <span className="icon">❄️</span>
                                </div>
                                <div className="status predictable">✓ Forecastable</div>
                            </div>
                            <h3>Avalanches</h3>
                            <p>Analyze snowpack layers, temperature changes, and terrain characteristics.</p>
                            <div className="card-stats">
                                <div className="stat">
                                    <span>Predictability</span>
                                    <strong>Medium</strong>
                                </div>
                                <div className="stat">
                                    <span>Feasibility</span>
                                    <div className="stars">★★★☆☆</div>
                                </div>
                            </div>
                        </div>
                        <div className="hazard-card">
                            <div className="card-header">
                                <div className="icon-wrapper">
                                    <span className="icon">🌍</span>
                                </div>
                                <div className="status predictable">✓ Forecastable</div>
                            </div>
                            <h3>Earthquake Risk Index</h3>
                            <p>We don't predict earthquakes—we assess preparedness and vulnerability levels.</p>
                            <div className="card-stats">
                                <div className="stat">
                                    <span>Predictability</span>
                                    <strong>Risk-based only</strong>
                                </div>
                                <div className="stat">
                                    <span>Feasibility</span>
                                    <div className="stars">★★★★☆</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="note-card">
                        <div className="note-icon">⚠️</div>
                        <div>
                            <h4>Why Risk Forecasting, Not Prediction?</h4>
                            <p>Earthquake prediction remains scientifically impossible. Instead, we provide <strong>risk indices and preparedness assessments</strong> based on geological data, historical patterns, and vulnerability analysis.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="section features">
                <div className="container">
                    <div className="features-content">
                        <div className="features-left">
                            <span className="section-badge">Key Features</span>
                            <h2 className="section-title">
                                Powered by Real <span className="gradient-text">Geophysical Data</span>
                            </h2>
                            <p className="section-text">
                                MountainShield combines multiple data sources and advanced AI to deliver
                                accurate, location-specific risk forecasts you can trust.
                            </p>
                            <div className="live-status">
                                <div className="status-dot active"></div>
                                <span><strong>2,847</strong> locations monitored in real-time</span>
                            </div>
                        </div>
                        <div className="features-right">
                            <div className="feature-item">
                                <div className="feature-icon">🛰️</div>
                                <div>
                                    <h4>Real-Time Data Integration</h4>
                                    <p>Continuous monitoring from satellite imagery, weather stations, and seismic sensors.</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🧠</div>
                                <div>
                                    <h4>AI-Powered Analysis</h4>
                                    <p>Machine learning models trained on decades of geophysical and climate data.</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🔔</div>
                                <div>
                                    <h4>Early Warning Alerts</h4>
                                    <p>Instant notifications when risk levels change for your monitored locations.</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">📍</div>
                                <div>
                                    <h4>Location-Aware Intelligence</h4>
                                    <p>Credibility-weighted forecasts based on local geological and climate conditions.</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">📊</div>
                                <div>
                                    <h4>Risk Level Visualization</h4>
                                    <p>Clear, actionable risk levels from Low to Extreme with confidence scores.</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🛡</div>
                                <div>
                                    <h4>Preparedness Recommendations</h4>
                                    <p>Tailored action plans and safety protocols based on current risk assessment.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="section how-it-works">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Our Process</span>
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-text">A transparent, science-backed approach to multi-hazard risk forecasting.</p>
                    </div>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">01</div>
                            <div className="step-icon">🗄️</div>
                            <h4>Data Collection</h4>
                            <p>We aggregate data from multiple sources: satellite imagery, weather stations, seismic networks, soil moisture sensors, and historical records.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">02</div>
                            <div className="step-icon">💻</div>
                            <h4>AI Processing</h4>
                            <p>Our machine learning models analyze patterns, correlations, and anomalies across all data streams to calculate probability distributions.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">03</div>
                            <div className="step-icon">📈</div>
                            <h4>Risk Assessment</h4>
                            <p>Generate location-specific risk levels with confidence scores, trigger thresholds, and actionable preparedness recommendations.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Protect Your Community?</h2>
                        <p>Start monitoring mountain hazards today. Get real-time risk assessments and early warnings for your region.</p>
                        <div className="cta-buttons">
                            <Link to="/login" className="btn-primary btn-lg">
    Try 🛡Kavach Now →
  </Link>

                            <button className="btn-secondary btn-lg">Contact Sales</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="logo">
                            <span>⛰️</span>
                            🛡Kavach
                        </div>
                        <p>© 2024 Kavach. AI-powered multi-hazard risk forecasting.</p>
                        <div className="footer-links">
                            <a href="#">Privacy</a>
                            <a href="#">Terms</a>
                            <a href="#">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Home;
