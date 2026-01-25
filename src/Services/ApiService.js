import axios from 'axios';
import api from '../Config/axios';
import { BASE_URL } from '../Config/constants';

class ApiService {
    static async uploadToAzure(file) {
        try {
            const useProxy = (process.env.REACT_APP_USE_SERVER_AZURE_PROXY || 'true') === 'true';
            const directUrl = process.env.REACT_APP_AZURE_UPLOAD_URL;
            const baseUrl = process.env.REACT_APP_AZURE_UPLOAD_BASE_URL;
            const functionKey = process.env.REACT_APP_AZURE_FUNCTION_KEY;

            const fd = new FormData();
            fd.append('file', file);
            fd.append('video', file);
            fd.append('filename', file?.name || 'upload.mp4');

            // Prefer server proxy to avoid browser CORS
            if (useProxy) {
                const proxyResp = await api.post('/api/studio/reels/azure/upload', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                const proxyData = proxyResp?.data;
                const proxyUrl = (typeof proxyData === 'string') ? proxyData
                    : proxyData?.url || proxyData?.videoUrl || proxyData?.video_url || proxyData?.location || proxyData?.blobUrl || '';
                if (proxyData?.success && proxyUrl) {
                    return { success: true, url: proxyUrl };
                }
                if (proxyData?.success && !proxyUrl) {
                    return { success: false, message: 'Azure upload via proxy succeeded but no URL returned' };
                }
                // If proxy fails, fall back to direct
            }

            let targetUrl = directUrl;
            const headers = { 'Content-Type': 'multipart/form-data' };
            const filename = file?.name || 'upload.mp4';
            if (filename) headers['x-filename'] = filename;
            if (!targetUrl && baseUrl) {
                targetUrl = `${baseUrl.replace(/\/$/, '')}/api/uploadreel`;
                if (functionKey) {
                    headers['x-functions-key'] = functionKey;
                }
            }
            if (!targetUrl) {
                return { success: false, message: 'Azure upload URL not configured' };
            }

            try {
                const urlObj = new URL(targetUrl);
                if (filename && !urlObj.searchParams.has('filename')) {
                    urlObj.searchParams.append('filename', filename);
                }
                targetUrl = urlObj.toString();
            } catch (_) {}

            const resp = await axios.post(targetUrl, fd, { headers });
            const data = resp?.data;
            // Try common response shapes
            const url = (typeof data === 'string') ? data
                : data?.url || data?.videoUrl || data?.video_url || data?.location || data?.blobUrl || '';
            if (!url) {
                return { success: false, message: 'Azure upload succeeded but no URL returned' };
            }
            return { success: true, url };
        } catch (error) {
            const status = error?.response?.status;
            const bodyMsg = error?.response?.data?.message || error?.response?.data || '';
            const message = bodyMsg || error.message || 'Azure upload failed';
            const corsHint = (status === 0 || message.includes('Failed to fetch')) ? 'Likely CORS. Ensure Function App CORS allows your origin and OPTIONS/POST responses include Access-Control-Allow-Origin.' : '';
            const combined = corsHint ? `${message} (${corsHint})` : message;
            return { success: false, message: combined };
        }
    }
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

    static async requestSellerPasswordReset(email) {
        const resp = await api.post('/studio/seller/forgot-password', { email });
        return resp.data;
    }

    static async requestInfluencerPasswordReset(email) {
        const resp = await api.post('/studio/influencer/forgot-password', { email });
        return resp.data;
    }

    static async resetSellerPassword(token, password) {
        const resp = await api.post('/studio/seller/reset-password', { token, password });
        return resp.data;
    }

    static async resetInfluencerPassword(token, password) {
        const resp = await api.post('/studio/influencer/reset-password', { token, password });
        return resp.data;
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

    // Delete seller reel
    static async deleteSellerReel(id) {
        try {
            const response = await api.delete(`/api/studio/reels/seller-reels/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting seller reel:', error);
            throw error;
        }
    }

    // Get all sellers
    // Modified by Vaishanvi to fetch only approved sellers from seller_approvals table
    static async getAllSellers() {
        try {
            const response = await api.get('/sellerapproval/approved-from-approvals');
            return response.data;
        } catch (error) {
            try {
                // Fallback to public endpoint
                const fallbackResponse = await api.get('/sellerapproval/all-public');
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
            // Log FormData contents for debugging
            console.log('Brand reel FormData contents:');
            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: File - ${value.name}, size: ${value.size} bytes, type: ${value.type}`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }
            
            // Send FormData directly to backend - backend will handle Azure upload
            // Important: Don't set Content-Type header - let browser set it with boundary for multipart/form-data
            // Use axios directly to avoid default JSON Content-Type from api instance
            const token = localStorage.getItem('token') || localStorage.getItem('studioToken');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            // Don't set Content-Type - browser will set it automatically with boundary for FormData
            
            const response = await axios.post(
                `${BASE_URL}/api/studio/reels/brand-reel-upload`,
                formData,
                { 
                    headers,
                    // Ensure axios doesn't transform FormData
                    transformRequest: [(data) => data]
                }
            );
            return response.data;
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Unknown server error';
            console.error('Error uploading brand reel:', message);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            return { success: false, message };
        }
    }

    // Upload seller reel with files
    static async uploadSellerReel(formData) {
        try {
            // Check if video file exists in FormData
            const videoFile = formData.get && formData.get('video');
            
            if (!videoFile) {
                console.error('No video file found in FormData');
                return { success: false, message: 'Video file is required' };
            }
            
            // Log FormData contents for debugging
            console.log('FormData contents:');
            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: File - ${value.name}, size: ${value.size}, type: ${value.type}`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }
            
            // Send FormData directly to backend - backend will handle Azure upload
            // Important: Don't set Content-Type header - let browser set it with boundary for multipart/form-data
            // Use axios directly to avoid default JSON Content-Type from api instance
            const token = localStorage.getItem('token') || localStorage.getItem('studioToken');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            // Don't set Content-Type - browser will set it automatically with boundary for FormData
            
            const response = await axios.post(
                `${BASE_URL}/api/studio/reels/admin/seller-upload`,
                formData,
                { 
                    headers,
                    // Ensure axios doesn't transform FormData
                    transformRequest: [(data) => data]
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error uploading seller reel:', error);
            const message = error?.response?.data?.message || error?.message || 'Unknown server error';
            console.error('Error message:', message);
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

    static async deleteBrandReel(id) {
        try {
            const response = await api.delete(`/api/studio/reels/brand-reels/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting brand reel:', error);
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

    // Get approved influencers with reel counts
    static async getApprovedInfluencersWithReelCounts() {
        try {
            const response = await api.get('/api/studio/reels/influencers/approved-with-counts');
            return response.data;
        } catch (error) {
            console.error('Error fetching approved influencers with reel counts:', error);
            throw error;
        }
    }

    // Get all approved influencer reels
    static async getAllApprovedInfluencerReels() {
        try {
            const response = await api.get('/api/studio/reels/influencers/approved-reels');
            return response.data;
        } catch (error) {
            console.error('Error fetching approved influencer reels:', error);
            throw error;
        }
    }

    // Get recent approved reels for dashboard
    static async getRecentApprovedReels(limit = 8) {
        try {
            const response = await api.get(`/api/studio/reels/recent-approved?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching recent approved reels:', error);
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

    static async deleteBrandReel(id) {
        try {
            const response = await api.delete(`/api/studio/reels/brand-reels/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting brand reel:', error);
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
