// API Endpoints Configuration
// Using environment variables for all API endpoints

export const API_ENDPOINTS = {
  // Base URLs
  BASE: process.env.REACT_APP_API_BASE_URL,
  STUDIO_REELS: process.env.REACT_APP_STUDIO_REELS_API,
  STUDIO_AUTH: process.env.REACT_APP_STUDIO_AUTH_API,

  // Authentication Endpoints
  AUTH: {
    SELLER: {
      LOGIN: process.env.REACT_APP_AUTH_SELLER_LOGIN,
      LOGIN_WITH_PASSWORD: process.env.REACT_APP_AUTH_SELLER_LOGIN_WITH_PASSWORD,
      SET_PASSWORD: process.env.REACT_APP_AUTH_SELLER_SET_PASSWORD,
      CHECK_DETAILS: process.env.REACT_APP_AUTH_SELLER_CHECK_DETAILS,
      REGISTER_FOR_REELS: process.env.REACT_APP_AUTH_SELLER_REGISTER_FOR_REELS,
      CHECK_EMAIL: process.env.REACT_APP_AUTH_SELLER_CHECK_EMAIL,
      FORGOT_PASSWORD: process.env.REACT_APP_AUTH_SELLER_FORGOT_PASSWORD,
      RESET_PASSWORD: process.env.REACT_APP_AUTH_SELLER_RESET_PASSWORD
    },
    INFLUENCER: {
      APPLY: process.env.REACT_APP_AUTH_INFLUENCER_APPLY,
      LOGIN: process.env.REACT_APP_AUTH_INFLUENCER_LOGIN,
      APPLY_FOR_REELS: process.env.REACT_APP_AUTH_INFLUENCER_APPLY_FOR_REELS,
      APPLICATIONS: process.env.REACT_APP_AUTH_INFLUENCER_APPLICATIONS,
      APPROVE: (id) => `${process.env.REACT_APP_AUTH_INFLUENCER_APPROVE}/${id}/approve`,
      REJECT: (id) => `${process.env.REACT_APP_AUTH_INFLUENCER_REJECT}/${id}/reject`,
      FORGOT_PASSWORD: process.env.REACT_APP_AUTH_INFLUENCER_FORGOT_PASSWORD,
      RESET_PASSWORD: process.env.REACT_APP_AUTH_INFLUENCER_RESET_PASSWORD
    }
  },

  // Reels Endpoints
  REELS: {
    // Profile
    PROFILE: {
      UPLOAD_IMAGE: process.env.REACT_APP_REELS_PROFILE_UPLOAD_IMAGE,
      UPDATE_IMAGE_PATH: process.env.REACT_APP_REELS_PROFILE_UPDATE_IMAGE_PATH
    },

    // Upload
    UPLOAD: {
      INFLUENCER: process.env.REACT_APP_REELS_UPLOAD_INFLUENCER,
      SELLER: process.env.REACT_APP_REELS_UPLOAD_SELLER
    },

    // Get Reels
    GET: {
      INFLUENCER_MY_REELS: process.env.REACT_APP_REELS_GET_INFLUENCER_MY_REELS,
      SELLER_REELS: (vendorId) => `${process.env.REACT_APP_REELS_GET_SELLER_REELS}/${vendorId}/reels`,
      SELLER_DASHBOARD_STATS: (vendorId) => `${process.env.REACT_APP_REELS_GET_SELLER_DASHBOARD_STATS}/${vendorId}/dashboard-stats`,
      SELLER_RECENT_REELS: (vendorId, limit = 5) => `${process.env.REACT_APP_REELS_GET_SELLER_RECENT_REELS}/${vendorId}/recent-reels?limit=${limit}`,
      REEL_BY_ID: (id) => `${process.env.REACT_APP_REELS_GET_REEL_BY_ID}/${id}`
    },

    // Categories, Sellers, Brands
    CATEGORIES: process.env.REACT_APP_REELS_CATEGORIES,
    SELLERS: process.env.REACT_APP_REELS_SELLERS,
    SELLER_PRODUCTS: (vendorId) => `${process.env.REACT_APP_REELS_SELLER_PRODUCTS}/${vendorId}/products`,
    BRANDS: process.env.REACT_APP_REELS_BRANDS,
    BRAND_PRODUCTS: (brandId) => `${process.env.REACT_APP_REELS_BRAND_PRODUCTS}/${brandId}/products`,
    ALL_PRODUCTS: process.env.REACT_APP_REELS_ALL_PRODUCTS,

    // Related Products
    RELATED_PRODUCTS: process.env.REACT_APP_REELS_RELATED_PRODUCTS,
    PRODUCT_NAMES: process.env.REACT_APP_REELS_PRODUCT_NAMES,
    ALL_PRODUCT_NAMES: process.env.REACT_APP_REELS_ALL_PRODUCT_NAMES,

    // Edit/Delete Reels
    EDIT_REEL: (id) => `${process.env.REACT_APP_REELS_EDIT_REEL}/${id}`,
    DELETE_REEL: (id) => `${process.env.REACT_APP_REELS_DELETE_REEL}/${id}`
  }
};

export default API_ENDPOINTS;