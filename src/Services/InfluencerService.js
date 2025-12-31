import api from '../Config/axios';

/**
 * Influencer Service
 * Handles all API calls related to influencer operations
 */
class InfluencerService {
    /**
     * Get all influencer applications
     * @returns {Promise} Response with influencer applications
     */
    static async getAllInfluencerApplications() {
        try {
            const response = await api.get('/Studio/influencer/applications');
            return response.data;
        } catch (error) {
            console.error('Error fetching influencer applications:', error);
            throw error;
        }
    }

    /**
     * Get influencer by ID
     * @param {number} id - Influencer ID
     * @returns {Promise} Response with influencer data
     */
    static async getInfluencerById(id) {
        try {
            const response = await api.get(`/Studio/influencer/applications`);
            if (response.data.success && Array.isArray(response.data.data)) {
                const influencer = response.data.data.find(inf => inf.id === parseInt(id));
                if (influencer) {
                    return {
                        success: true,
                        data: influencer
                    };
                }
            }
            return {
                success: false,
                message: 'Influencer not found'
            };
        } catch (error) {
            console.error('Error fetching influencer:', error);
            throw error;
        }
    }

    /**
     * Update influencer details
     * @param {number} id - Influencer ID
     * @param {Object} data - Influencer data to update
     * @param {string} data.firstname - First name
     * @param {string} data.lastname - Last name
     * @param {string} data.email - Email
     * @param {string} data.telephone - Telephone (optional)
     * @param {string} data.platform - Platform (optional)
     * @param {string} data.account_link - Account link (optional)
     * @param {number} data.status - Status (0=pending, 1=approved, 2=rejected)
     * @returns {Promise} Response with success status
     */
    static async updateInfluencer(id, data) {
        try {
            const response = await api.put(`/Studio/influencer/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating influencer:', error);
            throw error;
        }
    }

    /**
     * Approve influencer
     * @param {number} id - Influencer ID
     * @returns {Promise} Response with success status
     */
    static async approveInfluencer(id) {
        try {
            const response = await api.put(`/Studio/influencer/${id}/approve`);
            return response.data;
        } catch (error) {
            console.error('Error approving influencer:', error);
            throw error;
        }
    }

    /**
     * Reject influencer
     * @param {number} id - Influencer ID
     * @returns {Promise} Response with success status
     */
    static async rejectInfluencer(id) {
        try {
            const response = await api.put(`/Studio/influencer/${id}/reject`);
            return response.data;
        } catch (error) {
            console.error('Error rejecting influencer:', error);
            throw error;
        }
    }
}

export default InfluencerService;

