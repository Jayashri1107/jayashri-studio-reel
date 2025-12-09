// ApiService.js
import API_ENDPOINTS from '../Config/apiEndpoints';

const API_BASE_URL = API_ENDPOINTS.STUDIO_REELS;

class ApiService {

    // ==========================
    // 🔵 GET UNIVERSAL HELPER
    // ==========================
    static async get(url) {
        const token = localStorage.getItem('studioToken');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || `HTTP Error: ${response.status}`);
        }

        return response.json();
    }

    // ==========================
    // 🔵 POST UNIVERSAL HELPER
    // ==========================
    static async post(url, body) {
        const token = localStorage.getItem('studioToken');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || `HTTP Error: ${response.status}`);
        }

        return response.json();
    }

    // ==========================
    // 🔵 POST FORM DATA HELPER
    // ==========================
    static async postFormData(url, formData) {
        try {
            const token = localStorage.getItem('studioToken');
            const headers = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                let msg = "";
                try {
                    msg = (await response.json()).message;
                } catch {
                    msg = await response.text();
                }
                throw new Error(msg || `Request failed (${response.status})`);
            }

            return response.json();
        } catch (error) {
            console.error('Error in postFormData:', error);
            throw error;
        }
    }

    // ==========================
    // 🔵 PUT UNIVERSAL HELPER
    // ==========================
    static async put(url, body) {
        const token = localStorage.getItem('studioToken');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
            method: 'PUT',
            headers,
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || `HTTP Error: ${response.status}`);
        }

        return response.json();
    }

    // ==========================
    // 🔵 DELETE UNIVERSAL HELPER
    // ==========================
    static async delete(url) {
        const token = localStorage.getItem('studioToken');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || `HTTP Error: ${response.status}`);
        }

        return response.json();
    }

    // ==========================
    // 🔵 UPLOAD PROFILE IMAGE
    // ==========================
    static async uploadProfileImage(file) {
        const formData = new FormData();
        formData.append('profileImage', file);
        return this.postFormData(API_ENDPOINTS.REELS.PROFILE.UPLOAD_IMAGE, formData);
    }

    // ==========================
    // 🔵 UPDATE PROFILE IMAGE PATH IN DATABASE
    // ==========================
    static async updateProfileImagePath(imagePath) {
        return this.put(API_ENDPOINTS.REELS.PROFILE.UPDATE_IMAGE_PATH, { imagePath });
    }

    // ==========================
    // 🔵 GET SELLERS
    // ==========================
    static getSellers() {
        return this.get(API_ENDPOINTS.REELS.SELLERS);
    }

    // ==========================
    // 🔵 GET SELLER PRODUCTS
    // ==========================
    static getSellerProducts(vendorId) {
        return this.get(API_ENDPOINTS.REELS.SELLER_PRODUCTS(vendorId));
    }

    // ==========================
    // 🔵 GET BRANDS
    // ==========================
    static getBrands() {
        return this.get(API_ENDPOINTS.REELS.BRANDS);
    }

    // ==========================
    // 🔵 GET BRAND PRODUCTS
    // ==========================
    static getBrandProducts(brandId) {
        return this.get(API_ENDPOINTS.REELS.BRAND_PRODUCTS(brandId));
    }

    // ==========================
    // 🔵 GET CATEGORIES
    // ==========================
    static getCategories() {
        return this.get(API_ENDPOINTS.REELS.CATEGORIES);
    }

    // ==========================
    // 🔵 UPLOAD INFLUENCER REEL (FORM DATA)
    // ==========================
    static async uploadReel(formData) {
        try {
            const token = localStorage.getItem('studioToken');
            const headers = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(API_ENDPOINTS.REELS.UPLOAD.INFLUENCER, {
                method: 'POST',
                headers,
                body: formData,
                credentials: 'include' // VERY IMPORTANT
            });

            if (!response.ok) {
                let msg = "";
                try {
                    msg = (await response.json()).message;
                } catch {
                    msg = await response.text();
                }
                throw new Error(msg || `Upload failed (${response.status})`);
            }

            return response.json();
        } catch (error) {
            console.error('Error uploading reel:', error);
            throw error;
        }
    }

    // ==========================
    // 🔵 UPLOAD SELLER REEL (FORM DATA)
    // ==========================
    static async uploadSellerReel(formData) {
        try {
            const token = localStorage.getItem('studioToken');
            const headers = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(API_ENDPOINTS.REELS.UPLOAD.SELLER, {
                method: 'POST',
                headers,
                body: formData,
                credentials: 'include' // VERY IMPORTANT
            });

            if (!response.ok) {
                let msg = "";
                try {
                    msg = (await response.json()).message;
                } catch {
                    msg = await response.text();
                }
                throw new Error(msg || `Upload failed (${response.status})`);
            }

            return response.json();
        } catch (error) {
            console.error('Error uploading seller reel:', error);
            throw error;
        }
    }

    // ==========================
    // 🔵 GET REELS FOR INFLUENCER
    // ==========================
    static getInfluencerReels(filters = {}) {
        // Build query parameters from filters
        const queryParams = new URLSearchParams();
        
        // Add filters if they exist and are not empty
        if (filters.title) {
            queryParams.append('title', filters.title);
        }
        if (filters.product) {
            queryParams.append('product', filters.product);
        }
        if (filters.category) {
            queryParams.append('category', filters.category);
        }
        if (filters.status) {
            queryParams.append('status', filters.status);
        }
        if (filters.created) {
            queryParams.append('date', filters.created);
        }
        
        const queryString = queryParams.toString();
        const url = queryString 
            ? `${API_ENDPOINTS.REELS.GET.INFLUENCER_MY_REELS}?${queryString}`
            : API_ENDPOINTS.REELS.GET.INFLUENCER_MY_REELS;
        return this.get(url);
    }

    // ==========================
    // 🔵 GET REELS FOR SELLER
    // ==========================
    static getSellerReels(vendorId, filters = {}) {
        // Build query parameters from filters (excluding vendorId)
        const queryParams = new URLSearchParams();
        
        // Add filters if they exist
        if (filters.title) {
            queryParams.append('title', filters.title);
        }
        if (filters.category) {
            queryParams.append('category', filters.category);
        }
        if (filters.date) {
            queryParams.append('date', filters.date);
        }
        if (filters.product) {
            queryParams.append('product', filters.product);
        }
        if (filters.status) {
            queryParams.append('status', filters.status);
        }
        
        const queryString = queryParams.toString();
        const url = queryString 
            ? `${API_ENDPOINTS.REELS.GET.SELLER_REELS(vendorId)}?${queryString}`
            : API_ENDPOINTS.REELS.GET.SELLER_REELS(vendorId);
            
        console.log('API Service - Sending request to:', url);
        console.log('API Service - Filters:', filters);
        console.log('API Service - Query params:', queryString);
        
        return this.get(url);
    }

    // ==========================
    // 🔵 GET SELLER DASHBOARD STATS
    // ==========================
    static getSellerDashboardStats(vendorId) {
        return this.get(API_ENDPOINTS.REELS.GET.SELLER_DASHBOARD_STATS(vendorId));
    }

    // ==========================
    // 🔵 GET RECENT SELLER REELS
    // ==========================
    static getRecentSellerReels(vendorId, limit = 5) {
        return this.get(API_ENDPOINTS.REELS.GET.SELLER_RECENT_REELS(vendorId, limit));
    }

    // ==========================
    // 🔵 GET RELATED PRODUCTS
    // ==========================
    static getRelatedProducts(selectedProductIds, associationType, vendorId, brandId) {
        return this.post(API_ENDPOINTS.REELS.RELATED_PRODUCTS, {
            selectedProductIds,
            associationType,
            vendorId,
            brandId
        });
    }

    // ==========================
    // 🔵 GET REEL BY ID
    // ==========================
    static getReelById(id) {
        return this.get(API_ENDPOINTS.REELS.GET.REEL_BY_ID(id));
    }

    // ==========================
    // 🔵 EDIT REEL
    // ==========================
    static editReel(id, reelData) {
        return this.put(API_ENDPOINTS.REELS.EDIT_REEL(id), reelData);
    }

    // ==========================
    // 🔵 EDIT REEL WITH FILES
    // ==========================
    static async editReelWithFiles(id, formData) {
        try {
            const token = localStorage.getItem('studioToken');
            const headers = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(API_ENDPOINTS.REELS.EDIT_REEL(id), {
                method: 'PUT',
                headers,
                body: formData,
                credentials: 'include' // VERY IMPORTANT
            });

            if (!response.ok) {
                let msg = "";
                try {
                    msg = (await response.json()).message;
                } catch {
                    msg = await response.text();
                }
                throw new Error(msg || `Edit failed (${response.status})`);
            }

            return response.json();
        } catch (error) {
            console.error('Error editing reel with files:', error);
            throw error;
        }
    }

    // ==========================
    // 🔵 DELETE REEL
    // ==========================
    static deleteReel(id) {
        return this.delete(API_ENDPOINTS.REELS.DELETE_REEL(id));
    }

    // ==========================
    // 🔵 GET PRODUCT NAMES BY IDS
    // ==========================
    static getProductNamesByIds(productIds) {
        return this.post(API_ENDPOINTS.REELS.PRODUCT_NAMES, { productIds });
    }

    // ==========================
    // 🔵 GET ALL PRODUCT NAMES FOR AUTOCOMPLETE
    // ==========================
    static getAllProductNames() {
        return this.get(API_ENDPOINTS.REELS.ALL_PRODUCT_NAMES);
    }

    // ==========================
    // 🔵 GET ALL PRODUCTS
    // ==========================
    static getAllProducts() {
        return this.get(API_ENDPOINTS.REELS.ALL_PRODUCTS);
    }
    
    // ==========================
    // 🔵 AUTHENTICATION APIS
    // ==========================
    
    // Seller Login
    static async sellerLogin(email) {
        return this.post(API_ENDPOINTS.AUTH.SELLER.LOGIN, { email });
    }
    
    // Seller Login With Password
    static async sellerLoginWithPassword(email, password) {
        return this.post(API_ENDPOINTS.AUTH.SELLER.LOGIN_WITH_PASSWORD, { email, password });
    }
    
    // Set Seller Password
    static async setSellerPassword(email, password) {
        return this.post(API_ENDPOINTS.AUTH.SELLER.SET_PASSWORD, { email, password });
    }
    
    // Check Seller Details
    static async checkSellerDetails(data) {
        return this.post(API_ENDPOINTS.AUTH.SELLER.CHECK_DETAILS, data);
    }
    
    // Register Seller For Reels
    static async registerSellerForReels(data) {
        return this.post(API_ENDPOINTS.AUTH.SELLER.REGISTER_FOR_REELS, data);
    }
    
    // Check Seller Email
    static async checkSellerEmail(email) {
        return this.post(API_ENDPOINTS.AUTH.SELLER.CHECK_EMAIL, { email });
    }
    
    // Request Seller Password Reset
    static async requestSellerPasswordReset(email) {
        return this.post(API_ENDPOINTS.AUTH.SELLER.FORGOT_PASSWORD, { email });
    }
    
    // Reset Seller Password
    static async resetSellerPassword(data) {
        return this.post(API_ENDPOINTS.AUTH.SELLER.RESET_PASSWORD, data);
    }
    
    // Apply For Influencer
    static async applyForInfluencer(data) {
        return this.post(API_ENDPOINTS.AUTH.INFLUENCER.APPLY, data);
    }
    
    // Influencer Login
    static async influencerLogin(email, password) {
        return this.post(API_ENDPOINTS.AUTH.INFLUENCER.LOGIN, { email, password });
    }
    
    // Apply For Influencer Reels
    static async applyForInfluencerReels(data) {
        return this.post(API_ENDPOINTS.AUTH.INFLUENCER.APPLY_FOR_REELS, data);
    }
    
    // Get All Influencer Applications
    static async getAllInfluencerApplications() {
        return this.get(API_ENDPOINTS.AUTH.INFLUENCER.APPLICATIONS);
    }
    
    // Approve Influencer
    static async approveInfluencer(id) {
        return this.put(API_ENDPOINTS.AUTH.INFLUENCER.APPROVE(id), {});
    }
    
    // Reject Influencer
    static async rejectInfluencer(id) {
        return this.put(API_ENDPOINTS.AUTH.INFLUENCER.REJECT(id), {});
    }
    
    // Request Influencer Password Reset
    static async requestInfluencerPasswordReset(email) {
        return this.post(API_ENDPOINTS.AUTH.INFLUENCER.FORGOT_PASSWORD, { email });
    }
    
    // Reset Influencer Password
    static async resetInfluencerPassword(data) {
        return this.post(API_ENDPOINTS.AUTH.INFLUENCER.RESET_PASSWORD, data);
    }
}

export default ApiService;