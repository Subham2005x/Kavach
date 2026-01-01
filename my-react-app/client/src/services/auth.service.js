import { auth } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';

// Email/Password Authentication 

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} displayName - User's display name (optional)
 * @returns {Promise} User credential
 */
export const signUpWithEmail = async (email, password, displayName = '') => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    
    console.log('User signed up successfully:', userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign in an existing user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} User credential
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in successfully:', userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

// ================== Google Authentication ==================

/**
 * Sign in with Google popup
 * @returns {Promise} User credential
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    // Optional: Add custom parameters
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, provider);
    console.log('Google sign-in successful:', result.user);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { success: false, error: error.message };
  }
};

// Phone Authentication

/**
 * Initialize reCAPTCHA verifier for phone authentication
 * @param {string} containerId - ID of the container element for reCAPTCHA
 * @returns {RecaptchaVerifier} RecaptchaVerifier instance
 */
export const initRecaptcha = (containerId = 'recaptcha-container') => {
  try {
    // Clear any existing reCAPTCHA
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.log('Error clearing reCAPTCHA:', e);
      }
      window.recaptchaVerifier = null;
    }
    
    // Clear the container element
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
    
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible', // or 'normal' for visible reCAPTCHA
      callback: (response) => {
        // reCAPTCHA solved, allow phone auth
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
    
    return window.recaptchaVerifier;
  } catch (error) {
    console.error('reCAPTCHA initialization error:', error);
    throw error;
  }
};

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - Phone number with country code (e.g., +1234567890)
 * @returns {Promise} Confirmation result
 */
export const sendOTP = async (phoneNumber) => {
  try {
    // Always reinitialize reCAPTCHA to avoid rendering errors
    initRecaptcha();
    
    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    
    // Store confirmation result for OTP verification
    window.confirmationResult = confirmationResult;
    
    console.log('OTP sent successfully to:', phoneNumber);
    return { success: true, confirmationResult };
  } catch (error) {
    console.error('OTP send error:', error);
    // Clean up on error
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.log('Error clearing reCAPTCHA after error:', e);
      }
      window.recaptchaVerifier = null;
    }
    return { success: false, error: error.message };
  }
};

/**
 * Verify OTP and sign in with phone number
 * @param {string} otp - OTP code received by user
 * @returns {Promise} User credential
 */
export const verifyOTP = async (otp) => {
  try {
    if (!window.confirmationResult) {
      throw new Error('No confirmation result found. Please request OTP first.');
    }
    
    const result = await window.confirmationResult.confirm(otp);
    console.log('Phone sign-in successful:', result.user);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, error: error.message };
  }
};

// ================== Additional Auth Functions ==================

/**
 * Sign out the current user
 * @returns {Promise} Success status
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise} Success status
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current user
 * @returns {Object|null} Current user object or null
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 * @param {Function} callback - Callback function to handle user state
 * @returns {Function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Update user profile
 * @param {Object} profileData - Object with displayName and/or photoURL
 * @returns {Promise} Success status
 */
export const updateUserProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    await updateProfile(user, profileData);
    console.log('Profile updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { success: false, error: error.message };
  }
};
