// Utility file to demonstrate how to use environment-based API endpoints

// Import the API endpoints configuration
import API_ENDPOINTS from '../Config/apiEndpoints';

/**
 * Example of how to use the environment-based API endpoints
 */

// Example 1: Get a simple endpoint
export const getBaseApiUrl = () => {
  return API_ENDPOINTS.BASE;
};

// Example 2: Get an authentication endpoint
export const getSellerLoginEndpoint = () => {
  return API_ENDPOINTS.AUTH.SELLER.LOGIN;
};

// Example 3: Get a parameterized endpoint
export const getSellerReelsEndpoint = (vendorId) => {
  return API_ENDPOINTS.REELS.GET.SELLER_REELS(vendorId);
};

// Example 4: Using endpoints with fetch
export const fetchSellerReels = async (vendorId, token) => {
  try {
    const endpoint = API_ENDPOINTS.REELS.GET.SELLER_REELS(vendorId);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching seller reels:', error);
    throw error;
  }
};

// Example 5: Using endpoints with POST request
export const sellerLogin = async (email) => {
  try {
    const endpoint = API_ENDPOINTS.AUTH.SELLER.LOGIN;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error during seller login:', error);
    throw error;
  }
};

// Example 6: Using endpoints with POST request and password
export const sellerLoginWithPassword = async (email, password) => {
  try {
    const endpoint = API_ENDPOINTS.AUTH.SELLER.LOGIN_WITH_PASSWORD;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error during seller login with password:', error);
    throw error;
  }
};

export default {
  getBaseApiUrl,
  getSellerLoginEndpoint,
  getSellerReelsEndpoint,
  fetchSellerReels,
  sellerLogin,
  sellerLoginWithPassword
};