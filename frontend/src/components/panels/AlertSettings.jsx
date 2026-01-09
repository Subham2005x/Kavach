import React, { useState, useEffect } from 'react';
import { Bell, Mail, Phone, AlertTriangle, Check, X, History, Trash2, MapPin, Shield, Loader } from 'lucide-react';
import { db, auth } from '../../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './AlertSettings.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AlertSettings = ({ isOpen, onClose, riskData, location }) => {
  const [settings, setSettings] = useState({
    email: '',
    phone: '',
    landslide_threshold: 70,
    flood_threshold: 60,
    rainfall_threshold: 100,
    enable_email: false,
    enable_sms: false,
    alert_location: '',
    alert_lat: null,
    alert_lng: null
  });

  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'history'
  const [alertHistory, setAlertHistory] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  // OTP Verification states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadHistory();
      checkVerificationStatus();
    }
  }, [isOpen]);

  const checkVerificationStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const response = await fetch(`${API_BASE_URL}/alert/verification_status?user_id=${user.uid}`);
      const data = await response.json();
      if (data.status === 'success' && data.verified) {
        setIsVerified(true);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const handleUseCurrentLocation = () => {
    if (location) {
      const lat = location?.coordinates?.lat || location?.lat;
      const lng = location?.coordinates?.lng || location?.lng;
      if (lat && lng) {
        setSettings(prev => ({
          ...prev,
          alert_location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          alert_lat: lat,
          alert_lng: lng
        }));
        setUseCurrentLocation(true);
      }
    }
  };

  const handleManualLocation = (locationStr) => {
    setSettings(prev => ({ ...prev, alert_location: locationStr }));
    // Parse lat/lng from string if in format "lat, lng"
    const parts = locationStr.split(',').map(p => p.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setSettings(prev => ({ ...prev, alert_lat: lat, alert_lng: lng }));
      }
    }
    setUseCurrentLocation(false);
  };

  const loadSettings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      // Load from Firebase Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.alertSettings) {
          setSettings(data.alertSettings);
        }
      }
    } catch (error) {
      console.error('Error loading settings from Firebase:', error);
      // Fallback to backend API
      try {
        const response = await fetch(`${API_BASE_URL}/alert/settings?user_id=default`);
        const data = await response.json();
        if (data.status === 'success') {
          setSettings(data.settings);
        }
      } catch (backendError) {
        console.error('Error loading settings from backend:', backendError);
      }
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alert/history?limit=50`);
      const data = await response.json();
      if (data.status === 'success') {
        setAlertHistory(data.alerts.reverse());
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const sendVerificationOTP = async () => {
    if (!settings.phone) {
      alert('Please enter your phone number first');
      return;
    }
    
    setOtpLoading(true);
    try {
      const user = auth.currentUser;
      const response = await fetch(`${API_BASE_URL}/alert/send_verification_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.uid || 'default',
          phone: settings.phone
        })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setOtpSent(true);
        setShowOTPModal(true);
        alert(`✅ Verification code sent to ${settings.phone}\n\nPlease check your messages.`);
      } else {
        alert('❌ Failed to send OTP: ' + data.message);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('❌ Error sending OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      alert('Please enter the OTP code');
      return;
    }
    
    setOtpLoading(true);
    try {
      const user = auth.currentUser;
      const response = await fetch(`${API_BASE_URL}/alert/verify_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.uid || 'default',
          otp: otp
        })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setIsVerified(true);
        setShowOTPModal(false);
        setOtp('');
        setOtpSent(false);
        alert('✅ Phone number verified successfully!\n\nYou can now enable SMS alerts.');
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('❌ Error verifying OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      
      // Check if SMS is enabled but phone not verified
      if (settings.enable_sms && !isVerified) {
        alert('⚠️ Please verify your phone number before enabling SMS alerts.\n\nClick the "Verify Phone" button to get started.');
        return;
      }
      
      const userId = user?.uid || 'default';
      console.log('💾 Saving settings for user:', userId);
      console.log('📧 Settings to save:', settings);
      
      if (user) {
        // Save to Firebase Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          email: user.email,
          uid: user.uid,
          alertSettings: settings,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        console.log('✅ Settings saved to Firebase Firestore');
      }
      
      // Also save to backend for API access
      console.log('📡 Sending to backend API:', `${API_BASE_URL}/alert/settings?user_id=${userId}`);
      const response = await fetch(`${API_BASE_URL}/alert/settings?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      console.log('📥 Backend response:', data);
      
      if (data.status === 'success') {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        console.log('✅ Settings saved successfully to backend!');
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      alert('❌ Error saving settings. Please try again.');
    }
  };

  const checkCurrentAlerts = async () => {
    // Use saved alert location if available, otherwise use current dashboard location
    let testLocation = '';
    let testLat = null;
    let testLng = null;

    if (settings.alert_lat && settings.alert_lng) {
      testLat = settings.alert_lat;
      testLng = settings.alert_lng;
      testLocation = settings.alert_location || `${testLat.toFixed(4)}, ${testLng.toFixed(4)}`;
    } else if (location) {
      testLat = location?.coordinates?.lat || location?.lat;
      testLng = location?.coordinates?.lng || location?.lng;
      testLocation = `${testLat.toFixed(4)}, ${testLng.toFixed(4)}`;
    }

    if (!testLat || !testLng) {
      alert('Please select a location or configure an alert location first');
      return;
    }

    // If no risk data, use default test values
    const testRiskData = riskData || {
      landslide_risk: 75,
      flood_risk: 65,
      rainfall: 120
    };
    
    setIsTesting(true);
    try {
      const user = auth.currentUser;
      const userId = user?.uid || 'default';
      
      console.log('🧪 Testing alerts for user:', userId);
      console.log('📊 Test risk data:', testRiskData);
      console.log('⚙️ Current settings:', settings);
      console.log('📧 Email enabled?', settings.enable_email, '| Email:', settings.email);
      console.log('📱 SMS enabled?', settings.enable_sms, '| Phone:', settings.phone);
      
      const response = await fetch(`${API_BASE_URL}/alert/check?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landslide_risk: testRiskData.landslide_risk,
          flood_risk: testRiskData.flood_risk,
          rainfall: testRiskData.rainfall,
          location: testLocation
        })
      });
      const data = await response.json();
      console.log('📥 Alert check response:', data);
      
      if (data.status === 'success' && data.alerts.length > 0) {
        loadHistory();
        const notifications = data.notifications || {};
        const emailActuallySent = notifications.email_sent;
        const smsActuallySent = notifications.sms_sent;
        
        console.log('✅ Alerts triggered:', data.alerts.length);
        console.log('📧 Email actually sent?', emailActuallySent);
        console.log('📱 SMS actually sent?', smsActuallySent);
        
        const emailMsg = emailActuallySent ? `\n📧 Email sent to: ${settings.email}` : '';
        const smsMsg = smsActuallySent ? `\n📱 SMS sent to: ${settings.phone}` : '';
        
        let message = `✅ ${data.alerts.length} alert(s) triggered!${emailMsg}${smsMsg}`;
        
        if (!emailActuallySent && settings.enable_email) {
          message += '\n\n⚠️ Email was NOT sent - check backend logs';
        }
        if (!smsActuallySent && settings.enable_sms) {
          message += '\n\n⚠️ SMS was NOT sent - check backend logs';
        }
        
        alert(message);
      } else {
        console.log('⚠️ No alerts triggered or error:', data);
        alert('⚠️ No alerts triggered.\n\nCurrent conditions are below your thresholds.\n\nTip: Lower your thresholds temporarily to test the alert system.');
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
      alert('❌ Error checking alerts. Please try again.');
    } finally {
      setIsTesting(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all alert history?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/alert/history`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.status === 'success') {
        setAlertHistory([]);
      }
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const getAlertLevelColor = (level) => {
    switch (level) {
      case 'EMERGENCY': return '#ef4444';
      case 'WARNING': return '#fb923c';
      case 'WATCH': return '#eab308';
      default: return '#3b82f6';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alert-modal-header">
          <div className="alert-modal-title">
            <Bell size={24} />
            <span>Alert System</span>
          </div>
          <button className="alert-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="alert-tabs">
          <button 
            className={`alert-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Bell size={16} />
            Settings
          </button>
          <button 
            className={`alert-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} />
            History ({alertHistory.length})
          </button>
        </div>

        {activeTab === 'settings' ? (
          <div className="alert-content">
            <div className="alert-section">
              <h3>
                <MapPin size={18} style={{marginRight: '8px', color: '#3b82f6'}} />
                Alert Location
              </h3>
              <p className="alert-section-description">
                Choose the location you want to monitor for disaster alerts
              </p>
              
              <div className="alert-input-group">
                <div className="location-toggle-row">
                  <label className="location-toggle-label">
                    <input 
                      type="checkbox" 
                      id="use_current_location"
                      className="location-toggle-checkbox"
                      checked={useCurrentLocation}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleUseCurrentLocation();
                        } else {
                          setUseCurrentLocation(false);
                        }
                      }}
                    />
                    <span className="location-toggle-custom"></span>
                    <span className="location-toggle-text">
                      <MapPin size={16} />
                      Use Current Dashboard Location
                    </span>
                  </label>
                </div>

                <div className="location-input-wrapper">
                  <input 
                    type="text" 
                    className="location-input"
                    placeholder="Or enter coordinates (e.g., 28.7041, 77.1025) or location name"
                    value={settings.alert_location}
                    onChange={(e) => handleManualLocation(e.target.value)}
                    disabled={useCurrentLocation}
                  />
                  {settings.alert_lat && settings.alert_lng && (
                    <div className="location-coordinates">
                      <MapPin size={12} />
                      <span>{settings.alert_lat.toFixed(4)}, {settings.alert_lng.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="alert-section">
              <h3>Notification Methods</h3>
              <div className="alert-input-group">
                <div className="alert-checkbox-row">
                  <input 
                    type="checkbox" 
                    id="enable_email"
                    checked={settings.enable_email}
                    onChange={(e) => setSettings({...settings, enable_email: e.target.checked})}
                  />
                  <label htmlFor="enable_email">
                    <Mail size={16} />
                    Email Notifications
                  </label>
                </div>
                <input 
                  type="email" 
                  placeholder="your@email.com"
                  value={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  disabled={!settings.enable_email}
                />
              </div>

              <div className="alert-input-group">
                <div className="alert-checkbox-row">
                  <input 
                    type="checkbox" 
                    id="enable_sms"
                    checked={settings.enable_sms}
                    onChange={(e) => setSettings({...settings, enable_sms: e.target.checked})}
                  />
                  <label htmlFor="enable_sms">
                    <Phone size={16} />
                    SMS Notifications
                    {isVerified && (
                      <span style={{color: '#10b981', marginLeft: '8px', fontSize: '12px'}}>
                        <Check size={14} style={{display: 'inline', marginRight: '2px'}} />
                        Verified
                      </span>
                    )}
                  </label>
                </div>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                  <input 
                    type="tel" 
                    placeholder="+919876543210"
                    value={settings.phone}
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    disabled={!settings.enable_sms}
                    style={{flex: 1}}
                  />
                  {settings.enable_sms && !isVerified && (
                    <button
                      className="verify-phone-btn"
                      onClick={sendVerificationOTP}
                      disabled={otpLoading || !settings.phone}
                      title="Verify your phone number to enable SMS alerts"
                    >
                      <Shield size={16} />
                      {otpLoading ? 'Sending...' : 'Verify'}
                    </button>
                  )}
                </div>
                {settings.enable_sms && !isVerified && (
                  <p style={{fontSize: '12px', color: '#fb923c', marginTop: '8px', marginBottom: 0}}>
                    ⚠️ Phone verification required to enable SMS alerts
                  </p>
                )}
              </div>
            </div>

            <div className="alert-section">
              <h3>Alert Thresholds</h3>
              
              <div className="threshold-item">
                <label>
                  <AlertTriangle size={16} style={{color: '#ef4444'}} />
                  Landslide Risk: {settings.landslide_threshold}%
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={settings.landslide_threshold}
                  onChange={(e) => setSettings({...settings, landslide_threshold: parseInt(e.target.value)})}
                />
                <div className="threshold-labels">
                  <span>Watch: 70%</span>
                  <span>Warning: 85%</span>
                  <span>Emergency: 95%</span>
                </div>
              </div>

              <div className="threshold-item">
                <label>
                  <AlertTriangle size={16} style={{color: '#3b82f6'}} />
                  Flood Risk: {settings.flood_threshold}%
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={settings.flood_threshold}
                  onChange={(e) => setSettings({...settings, flood_threshold: parseInt(e.target.value)})}
                />
                <div className="threshold-labels">
                  <span>Watch: 60%</span>
                  <span>Warning: 80%</span>
                  <span>Emergency: 90%</span>
                </div>
              </div>

              <div className="threshold-item">
                <label>
                  <AlertTriangle size={16} style={{color: '#a855f7'}} />
                  Rainfall: {settings.rainfall_threshold}mm
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="300" 
                  value={settings.rainfall_threshold}
                  onChange={(e) => setSettings({...settings, rainfall_threshold: parseInt(e.target.value)})}
                />
                <div className="threshold-labels">
                  <span>Watch: 100mm</span>
                  <span>Warning: 150mm</span>
                  <span>Emergency: 200mm</span>
                </div>
              </div>
            </div>

            <div className="alert-actions">
              <button 
                className="alert-btn-secondary" 
                onClick={checkCurrentAlerts}
                disabled={isTesting}
                style={{ opacity: isTesting ? 0.7 : 1, cursor: isTesting ? 'not-allowed' : 'pointer' }}
              >
                {isTesting ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Sending Alerts...
                  </>
                ) : (
                  'Test Alert'
                )}
              </button>
              <button className="alert-btn-primary" onClick={handleSave}>
                {showSuccess ? <><Check size={16} /> Saved!</> : 'Save Settings'}
              </button>
            </div>
          </div>
        ) : (
          <div className="alert-content">
            <div className="alert-history-header">
              <h3>Alert History</h3>
              {alertHistory.length > 0 && (
                <button className="alert-clear-btn" onClick={clearHistory}>
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}
            </div>

            {alertHistory.length === 0 ? (
              <div className="alert-empty-state">
                <History size={48} />
                <p>No alerts triggered yet</p>
              </div>
            ) : (
              <div className="alert-history-list">
                {alertHistory.map((alert) => (
                  <div key={alert.id} className="alert-history-item">
                    <div 
                      className="alert-level-badge" 
                      style={{background: getAlertLevelColor(alert.level)}}
                    >
                      {alert.level}
                    </div>
                    <div className="alert-history-details">
                      <div className="alert-history-title">
                        {alert.type} - {alert.value}
                        {alert.type === 'Heavy Rainfall' ? 'mm' : '%'}
                      </div>
                      <div className="alert-history-message">{alert.message}</div>
                      <div className="alert-history-meta">
                        <span>{alert.location}</span>
                        <span>•</span>
                        <span>{alert.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="otp-modal-overlay" onClick={() => setShowOTPModal(false)}>
          <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="otp-modal-header">
              <div className="otp-modal-title">
                <Shield size={24} />
                <span>Verify Phone Number</span>
              </div>
              <button className="alert-close-btn" onClick={() => setShowOTPModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="otp-modal-content">
              <p style={{marginBottom: '16px', color: '#64748b'}}>
                Enter the 6-digit code sent to <strong>{settings.phone}</strong>
              </p>
              <input
                type="text"
                className="otp-input"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoFocus
              />
              <div style={{display: 'flex', gap: '8px', marginTop: '16px'}}>
                <button
                  className="alert-btn-secondary"
                  onClick={() => setShowOTPModal(false)}
                  style={{flex: 1}}
                >
                  Cancel
                </button>
                <button
                  className="alert-btn-primary"
                  onClick={verifyOTP}
                  disabled={otpLoading || otp.length !== 6}
                  style={{flex: 1}}
                >
                  {otpLoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              <button
                onClick={sendVerificationOTP}
                disabled={otpLoading}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Resend Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertSettings;
