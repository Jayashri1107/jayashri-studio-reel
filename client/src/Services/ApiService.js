import axios from 'axios';
import api from '../Config/axios';

class ApiService {
    // Save seller reel
    static async saveSellerReel(payload) {
        try {
            const response = await api.post('/api/studio/reels/save-reel', payload);
            return response.data;
        } catch (error) {
            console.error('Error saving seller reel:', error);
            throw error;
        }
    }

    static async getApprovedReelsCount() {
        try {
            const response = await api.get('/api/studio/reels/approved-counts');
            return response.data;
        } catch (error) {
            console.error('Error fetching approved reels count:', error);
            throw error;
        }
    }

    static async getSellerProducts(vendorId) {
        try {
            const response = await api.get(`/api/studio/reels/sellers/${vendorId}/products`);
            return response.data;
        } catch (error) {
            console.error('Error fetching seller products:', error);
            throw error;
        }
    }

    static async getAllBrands() {
        try {
            const response = await api.get('/api/studio/reels/brands');
            return response.data;
        } catch (error) {
            console.error('Error fetching brands:', error);
            throw error;
        }
    }

    // Get seller reels by ID
    static async getSellerReelsById(vendorId) {
        try {
            const response = await api.get(`/api/studio/reels/seller/${vendorId}`);
            return response.data;
        } catch (error) {
            try {
                // Fallback to public endpoint
                const fallbackResponse = await api.get(`/api/studio/reels/seller/${vendorId}/public`);
                return fallbackResponse.data;
            } catch (fallbackError) {
                console.error('Error fetching seller reels:', fallbackError);
                throw fallbackError;
            }
        }
    }

    // Approve seller reel
    static async approveSellerReel(id) {
        try {
            const response = await api.post(`/api/studio/reels/seller-reels/${id}/approve`);
            return response.data;
        } catch (error) {
            console.error('Error approving seller reel:', error);
            throw error;
        }
    }

    // Reject seller reel
    static async rejectSellerReel(id) {
        try {
            const response = await api.post(`/api/studio/reels/seller-reels/${id}/reject`);
            return response.data;
        } catch (error) {
            console.error('Error rejecting seller reel:', error);
            throw error;
        }
    }

    // Get all sellers
    // Modified by Vaishanvi to fetch only approved sellers from seller_approvals table
    static async getAllSellers() {
        try {
            const response = await api.get('/SellerApproval/approved-from-approvals');
            return response.data;
        } catch (error) {
            try {
                // Fallback to public endpoint
                const fallbackResponse = await api.get('/SellerApproval/all-public');
                return fallbackResponse.data;
            } catch (fallbackError) {
                console.error('Error fetching sellers:', fallbackError);
                throw fallbackError;
            }
        }
    }

    // Get all categories
    static async getAllCategories() {
        try {
            const response = await api.get('/api/studio/reels/categories');
            return response.data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    // Get brands
    static async getBrands() {
        try {
            const response = await api.get('/api/studio/reels/brands');
            return response.data;
        } catch (error) {
            console.error('Error fetching brands:', error);
            throw error;
        }
    }

    // Get products for a specific brand
    static async getBrandProducts(brandId) {
        try {
            const response = await api.get(`/api/studio/reels/brands/${brandId}/products`);
            return response.data;
        } catch (error) {
            console.error('Error fetching brand products:', error);
            throw error;
        }
    }

    // Save brand reel to brand_reels table
    static async saveBrandReel(payload) {
        try {
            const response = await api.post('/api/studio/reels/brand-reel', payload);
            return response.data;
        } catch (error) {
            console.error('Error saving brand reel:', error);
            throw error;
        }
    }

    // Upload brand reel with files
    static async uploadBrandReel(formData) {
        try {
            const response = await api.post('/api/studio/reels/brand-reel-upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            try {
                const response2 = await api.post('/SellerApproval/brand-reel-upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                return response2.data;
            } catch (fallbackError) {
                const message = fallbackError?.response?.data?.message || error?.response?.data?.message || fallbackError.message || error.message || 'Unknown server error';
                console.error('Error uploading brand reel:', message);
                return { success: false, message };
            }
        }
    }

    // Upload seller reel with files
    static async uploadSellerReel(formData) {
        try {
            const response = await api.post('/api/studio/reels/admin/seller-upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Unknown server error';
            console.error('Error uploading seller reel:', message);
            return { success: false, message };
        }
    }

    // Get brand reels
    static async getBrandReels() {
        try {
            const response = await api.get('/api/studio/reels/brand-reels');
            return response.data;
        } catch (error) {
            console.error('Error fetching brand reels:', error);
            throw error;
        }
    }

    // Edit brand reel
    static async editBrandReel(id, formData) {
        try {
            const response = await api.put(`/api/studio/reels/brand-reels/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error editing brand reel:', error);
            throw error;
        }
    }

    // Get influencer reels for admin list
    static async getInfluencerReelsAdmin() {
        try {
            const response = await api.get('/api/studio/reels/influencers/reels');
            return response.data;
        } catch (error) {
            console.error('Error fetching influencer reels:', error);   
            throw error;
        }
    }

    static async getInfluencerReelsById(influencerId) {
        try {
            const response = await api.get(`/api/studio/reels/influencer/${influencerId}/reels`);
            return response.data;
        } catch (error) {
            console.error('Error fetching influencer reels by id:', error);
            throw error;
        }
    }

    static async approveInfluencerReel(id) {
        try {
            const response = await api.post(`/api/studio/reels/influencer-reels/${id}/approve`);
            return response.data;
        } catch (error) {
            console.error('Error approving influencer reel:', error);
            throw error;
        }
    }

    static async rejectInfluencerReel(id) {
        try {
            const response = await api.post(`/api/studio/reels/influencer-reels/${id}/reject`);
            return response.data;
        } catch (error) {
            console.error('Error rejecting influencer reel:', error);
            throw error;
        }
    }

    static async deleteReel(id) {
        try {
            const response = await api.delete(`/api/studio/reels/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting reel:', error);
            throw error;
        }
    }

    static async getSellerReelsPublic(vendorId) {
        try {
            const response = await api.get(`/api/studio/reels/seller/${vendorId}/public`);
            return response.data;
        } catch (error) {
            console.error('Error fetching seller reels public:', error);
            throw error;
        }
    }

    static async getProductNamesByIds(productIds) {
        try {
            const response = await api.post('/api/studio/reels/product-names', { productIds });
            return response.data;
        } catch (error) {
            console.error('Error fetching product names:', error);
            throw error;
        }
    }

    // Get all products (for global search/autocomplete)
    static async getAllProducts() {
        try {
            const response = await api.get('/api/studio/reels/products/all');
            return response.data;
        } catch (error) {
            console.error('Error fetching all products:', error);
            throw error;
        }
    }
    static async getRecentApprovals(limit = 10) {
        try {
            const response = await api.get(`/api/studio/reels/recent-approvals?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching recent approvals:', error);
            throw error;
        }
    }

    // Get a specific reel by ID
    static async getReelById(id) {
        try {
            const response = await api.get(`/api/studio/reels/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching reel by ID:', error);
            throw error;
        }
    }

}

export default ApiService;
