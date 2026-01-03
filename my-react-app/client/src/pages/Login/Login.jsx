import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, sendOTP, verifyOTP, initRecaptcha } from '../../services/auth.service';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(true);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    otp: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register mode
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const result = await signUpWithEmail(
          formData.email,
          formData.password,
          formData.fullName
        );

        if (result.success) {
          console.log('Registration successful:', result.user);
          navigate('/dashboard'); // Redirect to home after successful registration
        } else {
          setError(result.error || 'Registration failed');
        }
      } else {
        // Login mode
        const result = await signInWithEmail(formData.email, formData.password);

        if (result.success) {
          console.log('Login successful:', result.user);
          navigate('/dashboard'); // Redirect to home after successful login
        } else {
          setError(result.error || 'Login failed');
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        console.log('Google sign-in successful:', result.user);
        navigate('/dashboard');
      } else {
        setError(result.error || 'Google sign-in failed');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    setError('');
    setLoading(true);

    try {
      if (!otpSent) {
        // Send OTP
        if (!formData.phoneNumber.startsWith('+')) {
          setError('Phone number must include country code (e.g., +1234567890)');
          setLoading(false);
          return;
        }

        // sendOTP will handle reCAPTCHA initialization
        const result = await sendOTP(formData.phoneNumber);
        
        if (result.success) {
          setOtpSent(true);
          setError('');
        } else {
          setError(result.error || 'Failed to send OTP');
        }
      } else {
        // Verify OTP
        if (!formData.otp || formData.otp.length !== 6) {
          setError('Please enter a valid 6-digit OTP');
          setLoading(false);
          return;
        }

        const result = await verifyOTP(formData.otp);
        
        if (result.success) {
          console.log('Phone sign-in successful:', result.user);
          navigate('/');
        } else {
          setError(result.error || 'Invalid OTP');
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <button className="back-btn" onClick={() => window.history.back()}>
          ← Back
        </button>

        <div className="login-left">
          <div className="logo-section">
            <div className="logo-icon">
              <span className="mountain">⛰️</span>
              <span className="shield">🛡️</span>
            </div>
            <h1>Kavach</h1>
          </div>
          
          {isRegister ? (
            <>
              <h2>Start Protecting Your</h2>
              <h3>Join Thousands who trust Kavach</h3>
              <p>for real-time hazard monitoring & AI-powered alerts</p>
            </>
          ) : (
            <>
              <h2>Welcome Back to</h2>
              <h3>Kavach</h3>
              <p>Continue monitoring mountain hazards and protecting your community with AI-powered risk assessment</p>
            </>
          )}
          
          <div className="features">
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <div>
                <h4>24/7 Monitoring</h4>
                <p>Instant Alerts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="form-header">
            <h4>{isRegister ? 'Create your Account' : 'Sign in to MountainShield'}</h4>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {!showPhoneAuth ? (
            <>
              <form onSubmit={handleSubmit} className="login-form">
                {isRegister && (
                  <div className="input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      disabled={loading}
                      required
                    />
                  </div>
                )}
                
                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                   value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                </div>

                {isRegister && (
                  <div className="input-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={loading}
                      required
                    />
                  </div>
                )}

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <span>⏳ {isRegister ? 'Creating Account...' : 'Signing In...'}</span>
                  ) : (
                    <span>{isRegister ? 'Create Account →' : 'Sign In →'}</span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="divider">
                <span>or continue with</span>
              </div>

              {/* Social Auth Buttons - Side by Side */}
              <div className="social-auth-buttons">
                {/* Google Sign In Button */}
                <button 
                  type="button" 
                  className="google-btn" 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  <span className="auth-btn-text">Google</span>
                </button>

                {/* Phone Number Sign In Button */}
                <button 
                  type="button" 
                  className="phone-btn" 
                  onClick={() => setShowPhoneAuth(true)}
                  disabled={loading}
                >
                  <span>📱</span>
                  <span className="auth-btn-text">Phone</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Phone Authentication Form */}
              <div className="phone-auth-form">
                {!otpSent ? (
                  <>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="+1234567890"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        disabled={loading}
                        required
                      />
                      <small>Include country code (e.g., +1 for US)</small>
                    </div>
                    <button 
                      type="button" 
                      className="submit-btn" 
                      onClick={handlePhoneAuth}
                      disabled={loading}
                    >
                      {loading ? '⏳ Sending OTP...' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="input-group">
                      <label>Enter OTP</label>
                      <input
                        type="text"
                        name="otp"
                        placeholder="123456"
                        maxLength="6"
                        value={formData.otp}
                        onChange={handleInputChange}
                        disabled={loading}
                        required
                      />
                      <small>Enter the 6-digit code sent to {formData.phoneNumber}</small>
                    </div>
                    <button 
                      type="button" 
                      className="submit-btn" 
                      onClick={handlePhoneAuth}
                      disabled={loading}
                    >
                      {loading ? '⏳ Verifying...' : 'Verify OTP'}
                    </button>
                    <button 
                      type="button" 
                      className="text-link" 
                      onClick={() => setOtpSent(false)}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </>
                )}
                
                <button 
                  type="button" 
                  className="back-to-email-btn" 
                  onClick={() => {
                    setShowPhoneAuth(false);
                    setOtpSent(false);
                    setFormData({ ...formData, phoneNumber: '', otp: '' });
                  }}
                  disabled={loading}
                >
                  ← Back to Email Login
                </button>
              </div>

              {/* reCAPTCHA container */}
              <div id="recaptcha-container"></div>
            </>
          )}

          {/* FIXED: class → className */}
          <div className="form-footer">
            {isRegister ? (
              <>
                <p>Already have an account? <button type="button" className="switch-link" onClick={() => setIsRegister(false)}>Login</button></p>
              </>
            ) : (
              <>
                <p>Don't have an account? <button type="button" className="switch-link" onClick={() => setIsRegister(true)}>Create Account</button></p>
                <a href="#" className="forgot-link">Forgot Password?</a>
              </>
            )}
            <p className="terms">By creating an account, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
