/**
 * API Service for Backend Communication
 * Handles all HTTP requests to the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Simulate disaster risk assessment
 * @param {Object} simulationData - Simulation parameters
 * @returns {Promise<Object>} Risk assessment results
 */
export const simulateRisk = async (simulationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simulationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error simulating risk:', error);
    throw error;
  }
};

/**
 * Get AI-powered risk explanation from Gemini
 * @param {Object} riskData - Risk data to explain
 * @returns {Promise<Object>} AI explanation
 */
export const getAIExplanation = async (riskData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat_explanation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(riskData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting AI explanation:', error);
    throw error;
  }
};
