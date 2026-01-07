import React from 'react';

const ADVISORY_CONFIG = {
  low: {
    advisories: [
      'Continue normal activities',
      'Monitor routine weather forecasts',
      'Maintain basic emergency preparedness',
    ],
  },
  moderate: {
    advisories: [
      'Stay alert to changing weather conditions',
      'Review local evacuation procedures',
      'Avoid unnecessary travel in vulnerable areas',
      'Keep communication channels open',
    ],
  },
  high: {
    advisories: [
      'Avoid mountainous and elevated terrain',
      'Closely monitor official weather alerts',
      'Prepare emergency evacuation routes',
      'Ensure emergency supplies are accessible',
    ],
  },
  severe: {
    advisories: [
      'Avoid all high-risk zones immediately',
      'Follow evacuation orders from authorities',
      'Suspend non-essential travel and activities',
      'Keep emergency services contact information ready',
    ],
  },
};

const SafetyAdvisory = ({ riskLevel = 'moderate' }) => {
  const normalizedRisk = riskLevel.toLowerCase();
  const config = ADVISORY_CONFIG[normalizedRisk] || ADVISORY_CONFIG.moderate;

  return (
    <div className="safety-advisory-section">
      <div className="safety-advisory-header">
        <span className="safety-advisory-icon">⚠️</span>
        <span className="safety-advisory-title">Safety Advisory</span>
      </div>

      <div className="safety-advisory-list">
        {config.advisories.map((advisory, index) => (
          <div key={index} className="safety-advisory-item">
            <span className="safety-advisory-checkmark">✓</span>
            <span>{advisory}</span>
          </div>
        ))}
      </div>

      <div className="safety-risk-level">
        <span className="safety-risk-level-label">Risk Level</span>
        <span className="safety-risk-level-value">
          {normalizedRisk.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

export default SafetyAdvisory;
