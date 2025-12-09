# Studio API Endpoints Configuration

This document explains how to use the centralized API endpoints configuration in the Studio application.

## Overview

All API endpoints are now centralized in a single configuration file located at `src/Config/apiEndpoints.js`. This makes it easier to manage, update, and maintain API endpoints across the application.

## File Structure

```
src/
├── Config/
│   ├── apiEndpoints.js      # Centralized API endpoints configuration
│   └── README.md           # This documentation file
├── Services/
│   └── ApiService.js       # Updated to use the centralized endpoints
└── Pages/
    ├── Seller/SellerLogin.js      # Example of updated component
    ├── Influencer/InfluencerLogin.js  # Example of updated component
    └── Dashboard/Login.js     # Example of updated component
```

## Usage Examples

### 1. Importing the API Endpoints

```javascript
import API_ENDPOINTS from '../Config/apiEndpoints';
```

### 2. Using Endpoints Directly

```javascript
// Get a specific endpoint
const sellerReelsEndpoint = API_ENDPOINTS.REELS.GET.SELLER_REELS(vendorId);

// Use with fetch
const response = await fetch(API_ENDPOINTS.REELS.CATEGORIES);
```

### 3. Using with ApiService (Recommended)

```javascript
import ApiService from '../Services/ApiService';

// Get seller reels
const reels = await ApiService.getSellerReels(vendorId, filters);

// Upload influencer reel
const result = await ApiService.uploadReel(formData);

// Login seller
const loginResult = await ApiService.sellerLoginWithPassword(email, password);
```

## Available Endpoints

### Authentication Endpoints

- `API_ENDPOINTS.AUTH.SELLER.LOGIN`
- `API_ENDPOINTS.AUTH.SELLER.LOGIN_WITH_PASSWORD`
- `API_ENDPOINTS.AUTH.SELLER.SET_PASSWORD`
- `API_ENDPOINTS.AUTH.SELLER.CHECK_DETAILS`
- `API_ENDPOINTS.AUTH.SELLER.REGISTER_FOR_REELS`
- `API_ENDPOINTS.AUTH.SELLER.CHECK_EMAIL`
- `API_ENDPOINTS.AUTH.SELLER.FORGOT_PASSWORD`
- `API_ENDPOINTS.AUTH.SELLER.RESET_PASSWORD`

- `API_ENDPOINTS.AUTH.INFLUENCER.APPLY`
- `API_ENDPOINTS.AUTH.INFLUENCER.LOGIN`
- `API_ENDPOINTS.AUTH.INFLUENCER.APPLY_FOR_REELS`
- `API_ENDPOINTS.AUTH.INFLUENCER.APPLICATIONS`
- `API_ENDPOINTS.AUTH.INFLUENCER.APPROVE(id)`
- `API_ENDPOINTS.AUTH.INFLUENCER.REJECT(id)`
- `API_ENDPOINTS.AUTH.INFLUENCER.FORGOT_PASSWORD`
- `API_ENDPOINTS.AUTH.INFLUENCER.RESET_PASSWORD`

### Reels Endpoints

#### Profile
- `API_ENDPOINTS.REELS.PROFILE.UPLOAD_IMAGE`
- `API_ENDPOINTS.REELS.PROFILE.UPDATE_IMAGE_PATH`

#### Upload
- `API_ENDPOINTS.REELS.UPLOAD.INFLUENCER`
- `API_ENDPOINTS.REELS.UPLOAD.SELLER`

#### Get Reels
- `API_ENDPOINTS.REELS.GET.INFLUENCER_MY_REELS`
- `API_ENDPOINTS.REELS.GET.SELLER_REELS(vendorId)`
- `API_ENDPOINTS.REELS.GET.SELLER_DASHBOARD_STATS(vendorId)`
- `API_ENDPOINTS.REELS.GET.SELLER_RECENT_REELS(vendorId, limit)`
- `API_ENDPOINTS.REELS.GET.REEL_BY_ID(id)`

#### Categories, Sellers, Brands
- `API_ENDPOINTS.REELS.CATEGORIES`
- `API_ENDPOINTS.REELS.SELLERS`
- `API_ENDPOINTS.REELS.SELLER_PRODUCTS(vendorId)`
- `API_ENDPOINTS.REELS.BRANDS`
- `API_ENDPOINTS.REELS.BRAND_PRODUCTS(brandId)`
- `API_ENDPOINTS.REELS.ALL_PRODUCTS`

#### Related Products
- `API_ENDPOINTS.REELS.RELATED_PRODUCTS`
- `API_ENDPOINTS.REELS.PRODUCT_NAMES`
- `API_ENDPOINTS.REELS.ALL_PRODUCT_NAMES`

#### Edit/Delete Reels
- `API_ENDPOINTS.REELS.EDIT_REEL(id)`
- `API_ENDPOINTS.REELS.DELETE_REEL(id)`

## Benefits

1. **Centralized Management**: All endpoints are in one place, making updates easier
2. **Consistency**: Ensures consistent endpoint usage across the application
3. **Maintainability**: Changes to base URLs or endpoint paths only need to be made in one location
4. **Type Safety**: Provides a structured way to access endpoints
5. **Reduced Errors**: Minimizes typos and inconsistencies in endpoint URLs

## Best Practices

1. **Use ApiService Methods**: Prefer using the methods in ApiService.js rather than calling endpoints directly
2. **Parameterized Endpoints**: For endpoints that require parameters (like IDs), use the function form:
   ```javascript
   // Correct
   const endpoint = API_ENDPOINTS.REELS.GET.REEL_BY_ID(reelId);
   
   // Incorrect
   const endpoint = API_ENDPOINTS.REELS.GET.REEL_BY_ID; // This won't work
   ```
3. **Environment-Specific URLs**: The base URLs can be easily changed for different environments (dev, staging, prod)

## Updating Endpoints

To add or modify endpoints:

1. Edit `src/Config/apiEndpoints.js`
2. Add new endpoints to the appropriate section
3. If adding new functionality, also add corresponding methods to `ApiService.js`
4. Update any components that use the endpoints

This approach ensures that all API endpoint management is centralized and easy to maintain.