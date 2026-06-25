const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Custom error class
class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'ApiError';
  }
}

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.message || data.error || 'Request failed',
        data.details || null
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout. Please try again.');
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Network error. Please check your internet connection.');
  }
};

// Get all meetings
const getMeetings = async () => {
  try {
    return await apiCall('/meetings');
  } catch (error) {
    console.error('Error fetching meetings:', error);
    throw error;
  }
};

// Create a new meeting
const createMeeting = async (title) => {
  try {
    return await apiCall('/meetings', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
};

// Get a single meeting
const getMeeting = async (id) => {
  try {
    return await apiCall(`/meetings/${id}`);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    throw error;
  }
};

// Update meeting
const updateMeeting = async (id, data) => {
  try {
    return await apiCall(`/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    throw error;
  }
};

// Delete meeting
const deleteMeeting = async (id) => {
  try {
    return await apiCall(`/meetings/${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
};

// Generate AI summary
const generateSummary = async (text) => {
  try {
    return await apiCall('/summarize', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
};

module.exports = {
  ApiError,
  getMeetings,
  createMeeting,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  generateSummary
};