import { auth } from "../config/firebase";
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
  onAuthStateChanged,
} from "firebase/auth";

// ================== Email/Password Authentication ==================

export const signUpWithEmail = async (email, password, displayName = "") => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: error.message };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message };
  }
};

// ================== Google Authentication ==================

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await signInWithPopup(auth, provider);
    return { success: true, user: result.user };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return { success: false, error: error.message };
  }
};

// ================== Phone Authentication ==================

export const initRecaptcha = (containerId = "recaptcha-container") => {
  try {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.log("Error clearing reCAPTCHA:", e);
      }
      window.recaptchaVerifier = null;
    }

    const container = document.getElementById(containerId);
    if (container) container.innerHTML = "";

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => console.log("reCAPTCHA verified"),
      "expired-callback": () => console.log("reCAPTCHA expired"),
    });

    return window.recaptchaVerifier;
  } catch (error) {
    console.error("reCAPTCHA initialization error:", error);
    throw error;
  }
};

export const sendOTP = async (phoneNumber) => {
  try {
    initRecaptcha();

    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

    window.confirmationResult = confirmationResult;
    return { success: true, confirmationResult };
  } catch (error) {
    console.error("OTP send error:", error);

    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.log("Error clearing reCAPTCHA after error:", e);
      }
      window.recaptchaVerifier = null;
    }

    return { success: false, error: error.message };
  }
};

export const verifyOTP = async (otp) => {
  try {
    if (!window.confirmationResult) {
      throw new Error("No confirmation result found. Please request OTP first.");
    }

    const result = await window.confirmationResult.confirm(otp);
    return { success: true, user: result.user };
  } catch (error) {
    console.error("OTP verification error:", error);
    return { success: false, error: error.message };
  }
};

// ================== Additional Auth Functions ==================

/**
 * Logout (this is what Dashboard should import as `logout`)
 */
export const logout = async () => {
  try {
    await signOut(auth); // Firebase sign-out [web:100]
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: error.message };
  }
};

// Backward compatibility (optional)
export const logoutUser = logout;

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Raw Firebase user object
 */
export const getCurrentUser = () => auth.currentUser;

/**
 * Friendly profile object for UI dropdown: { name, email }
 */
export const getCurrentUserProfile = () => {
  const u = auth.currentUser;
  if (!u) return null;

  return {
    name: u.displayName || "User",
    email: u.email || "",
  };
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export const updateUserProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is currently signed in");

    await updateProfile(user, profileData);
    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, error: error.message };
  }
};
