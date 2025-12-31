/**
 * Notification Service
 * Handles sending WhatsApp notifications for studio approval workflow
 */

const axios = require('axios');
const { waClientConfig, isWAClientEnabled, getWAClientEndpoint, getAllWAClientEndpoints } = require('./waClientConfig');
const { getMessageTemplate } = require('./messageTemplates');

/**
 * Formats phone number to ensure proper format for WA Client
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) {
        return null;
    }
    
    // Remove all non-digit characters except +
    let formatted = phoneNumber.toString().trim().replace(/[^\d+]/g, '');
    
    // If phone doesn't start with +, assume it's Indian number and add +91
    if (!formatted.startsWith('+')) {
        // Remove leading zeros if present
        formatted = formatted.replace(/^0+/, '');
        // Add country code if not already present
        if (!formatted.startsWith('91')) {
            formatted = '91' + formatted;
        }
        formatted = '+' + formatted;
    }
    
    console.log('[Notification] Phone formatting - Input:', phoneNumber, 'Output:', formatted);
    return formatted;
};

/**
 * Sends WhatsApp message via WA Client API
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<Object>} API response
 */
const sendWhatsAppMessage = async (phoneNumber, message) => {
    if (!isWAClientEnabled()) {
        throw new Error('WA Client is not enabled or not properly configured');
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
        throw new Error('Invalid phone number provided');
    }

    const endpoints = getAllWAClientEndpoints();
    const primaryEndpoint = endpoints[0];
    
    if (!primaryEndpoint) {
        throw new Error('WA Client API URL is not configured');
    }

    const phoneWithoutPlus = formattedPhone.replace('+', '');
    
    console.log('[Notification] Sending WhatsApp message');
    console.log('[Notification] Phone number:', phoneWithoutPlus);
    console.log('[Notification] Message length:', message.length, 'characters');
    console.log('[Notification] Endpoint:', primaryEndpoint);
    
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        // Try multiple payload formats to ensure compatibility with waclient.com API
        // Format 1: Standard format with number and message
        const payload = {
            instance_id: waClientConfig.instanceId,
            access_token: waClientConfig.accessToken,
            number: phoneWithoutPlus,
            message: message
        };
        
        console.log('[Notification] ===== ATTEMPTING API CALL =====');
        console.log('[Notification] Endpoint:', primaryEndpoint);
        console.log('[Notification] Phone number:', phoneWithoutPlus);
        console.log('[Notification] Instance ID:', waClientConfig.instanceId);
        console.log('[Notification] Access Token:', waClientConfig.accessToken ? '***present***' : 'MISSING');
        console.log('[Notification] Message length:', message.length, 'characters');
        console.log('[Notification] Request payload (sanitized):', JSON.stringify({ 
            ...payload, 
            access_token: '***hidden***',
            message: message.substring(0, 150) + '... (truncated)'
        }, null, 2));
        console.log('[Notification] =================================');
        
        const response = await axios.post(primaryEndpoint, payload, {
            headers: headers,
            timeout: 30000,
            validateStatus: function (status) {
                // Accept all status codes to handle responses properly
                return status >= 200 && status < 600;
            }
        });

        // Verify the response and message content
        const responseData = response.data || {};
        const httpStatus = response.status;
        const isHttpSuccess = httpStatus >= 200 && httpStatus < 300;
        
        // Check for various success indicators
        const apiSuccess = responseData.status === 'success' || 
                          responseData.success === true || 
                          responseData.message === 'Message sent successfully' ||
                          (isHttpSuccess && !responseData.error);
        
        console.log('[Notification] ===== WHATSAPP API RESPONSE =====');
        console.log('[Notification] HTTP Status:', httpStatus, response.statusText);
        console.log('[Notification] Response Headers:', JSON.stringify(response.headers, null, 2));
        console.log('[Notification] Response Data Type:', typeof responseData);
        console.log('[Notification] Full Response Data:', JSON.stringify(responseData, null, 2));
        console.log('[Notification] API Success Check:', {
            httpStatus: isHttpSuccess,
            apiStatus: responseData.status,
            apiSuccess: responseData.success,
            hasError: !!responseData.error,
            calculatedSuccess: apiSuccess
        });
        
        // Verify message content was actually sent (check response)
        const messagePayload = responseData.message_payload || responseData.payload || {};
        const actualMessage = messagePayload.message || responseData.message || {};
        const textContent = actualMessage.extendedTextMessage?.text || 
                           actualMessage.textMessage?.text || 
                           actualMessage.text || 
                           responseData.text ||
                           '';
        
        if (textContent && textContent.length > 0) {
            console.log('[Notification] ✅ Message content found in response');
            console.log('[Notification] Message preview (first 150 chars):', textContent.substring(0, 150) + '...');
        } else {
            console.log('[Notification] ⚠️ Message content not echoed in response (this may be normal)');
        }
        
        console.log('[Notification] ====================================');
        
        // Determine if the request was successful
        if (!isHttpSuccess || (!apiSuccess && responseData.error)) {
            console.error('[Notification] ❌ API request failed');
            console.error('[Notification] HTTP Status:', httpStatus);
            console.error('[Notification] Error in response:', responseData.error || responseData.message || responseData.msg);
            throw new Error(`WA Client API error: ${responseData.message || responseData.error || responseData.msg || `HTTP ${httpStatus}`}`);
        }
        
        // If we got here, consider it successful
        console.log('[Notification] ✅✅✅ API CALL SUCCESSFUL');
        console.log('[Notification] Response indicates message was sent to WhatsApp');
        
        return {
            success: true,
            data: response.data,
            status: response.status,
            message: 'WhatsApp message sent successfully'
        };
    } catch (error) {
        console.error('[Notification] ===== WHATSAPP API ERROR =====');
        console.error('[Notification] Error Type:', error.constructor.name);
        console.error('[Notification] Error Message:', error.message);
        
        if (error.response) {
            console.error('[Notification] HTTP Status:', error.response.status);
            console.error('[Notification] Response Headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('[Notification] Full Response Data:', JSON.stringify(error.response.data, null, 2));
            throw new Error(`WA Client API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.error('[Notification] No response received from API');
            console.error('[Notification] Request details:', {
                url: primaryEndpoint,
                method: 'POST',
                timeout: 30000
            });
            throw new Error('WA Client API request failed: No response received');
        } else {
            console.error('[Notification] Error Stack:', error.stack);
            throw new Error(`WA Client API error: ${error.message}`);
        }
    }
};

/**
 * Sends approval notification to influencer
 * @param {Object} influencerData - Influencer data object
 * @returns {Promise<Object>} Notification result
 */
const sendInfluencerApprovalNotification = async (influencerData) => {
    console.log('[Notification] Attempting to send influencer approval notification');
    console.log('[Notification] WA Client enabled:', isWAClientEnabled());
    console.log('[Notification] Influencer data:', { 
        id: influencerData.id, 
        name: influencerData.firstname, 
        phone: influencerData.telephone 
    });

    if (!isWAClientEnabled()) {
        console.error('[Notification] WA Client is not enabled or not properly configured');
        return { success: false, message: 'WA Client is not enabled' };
    }

    const phoneNumber = influencerData.telephone;

    if (!phoneNumber) {
        console.error('[Notification] Phone number not available for influencer:', influencerData.id);
        return { success: false, message: 'Phone number not available for influencer' };
    }

    // Get message from template
    const message = getMessageTemplate('influencerApproval', influencerData, {
        appUrl: waClientConfig.appUrl
    });
    
    console.log('[Notification] ✅ Message template generated for influencer approval');
    console.log('[Notification] 📨 Complete message to be sent:');
    console.log('[Notification] ========================================');
    console.log(message);
    console.log('[Notification] ========================================');

    try {
        const result = await sendWhatsAppMessage(phoneNumber, message);
        return {
            success: true,
            message: 'Approval notification sent successfully',
            data: result.data
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to send approval notification',
            error: error.message
        };
    }
};

/**
 * Sends rejection notification to influencer
 * @param {Object} influencerData - Influencer data object
 * @returns {Promise<Object>} Notification result
 */
const sendInfluencerRejectionNotification = async (influencerData) => {
    console.log('[Notification] Attempting to send influencer rejection notification');
    console.log('[Notification] WA Client enabled:', isWAClientEnabled());
    console.log('[Notification] Influencer data:', { 
        id: influencerData.id, 
        name: influencerData.firstname, 
        phone: influencerData.telephone 
    });

    if (!isWAClientEnabled()) {
        console.error('[Notification] WA Client is not enabled or not properly configured');
        return { success: false, message: 'WA Client is not enabled' };
    }

    const phoneNumber = influencerData.telephone;

    if (!phoneNumber) {
        console.error('[Notification] Phone number not available for influencer:', influencerData.id);
        return { success: false, message: 'Phone number not available for influencer' };
    }

    // Get message from template
    const message = getMessageTemplate('influencerRejection', influencerData, {
        appUrl: waClientConfig.appUrl
    });
    
    console.log('[Notification] ✅ Message template generated for influencer rejection');
    console.log('[Notification] 📨 Complete message to be sent:');
    console.log('[Notification] ========================================');
    console.log(message);
    console.log('[Notification] ========================================');

    try {
        const result = await sendWhatsAppMessage(phoneNumber, message);
        return {
            success: true,
            message: 'Rejection notification sent successfully',
            data: result.data
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to send rejection notification',
            error: error.message
        };
    }
};

/**
 * Sends pending application notification to influencer
 * @param {Object} influencerData - Influencer data object
 * @returns {Promise<Object>} Notification result
 */
const sendInfluencerPendingNotification = async (influencerData) => {
    console.log('[Notification] Attempting to send influencer pending notification');
    console.log('[Notification] WA Client enabled:', isWAClientEnabled());
    console.log('[Notification] Influencer data:', { 
        id: influencerData.id, 
        name: influencerData.firstname, 
        phone: influencerData.telephone 
    });

    if (!isWAClientEnabled()) {
        console.error('[Notification] WA Client is not enabled or not properly configured');
        return { success: false, message: 'WA Client is not enabled' };
    }

    const phoneNumber = influencerData.telephone;

    if (!phoneNumber) {
        console.error('[Notification] Phone number not available for influencer:', influencerData.id);
        return { success: false, message: 'Phone number not available for influencer' };
    }

    // Get message from template
    const message = getMessageTemplate('influencerPending', influencerData, {
        appUrl: waClientConfig.appUrl
    });
    
    console.log('[Notification] ✅ Message template generated for influencer pending');
    console.log('[Notification] 📨 Complete message to be sent:');
    console.log('[Notification] ========================================');
    console.log(message);
    console.log('[Notification] ========================================');

    try {
        const result = await sendWhatsAppMessage(phoneNumber, message);
        return {
            success: true,
            message: 'Pending notification sent successfully',
            data: result.data
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to send pending notification',
            error: error.message
        };
    }
};

/**
 * Sends approval notification to seller
 * @param {Object} sellerData - Seller data object
 * @returns {Promise<Object>} Notification result
 */
const sendSellerApprovalNotification = async (sellerData) => {
    console.log('[Notification] Attempting to send seller approval notification');
    console.log('[Notification] WA Client enabled:', isWAClientEnabled());
    console.log('[Notification] Seller data:', { 
        vendorId: sellerData.vendor_id, 
        name: sellerData.firstname, 
        phone: sellerData.telephone 
    });

    if (!isWAClientEnabled()) {
        console.error('[Notification] WA Client is not enabled or not properly configured');
        return { success: false, message: 'WA Client is not enabled' };
    }

    const phoneNumber = sellerData.telephone;

    if (!phoneNumber) {
        console.error('[Notification] Phone number not available for seller:', sellerData.vendor_id);
        return { success: false, message: 'Phone number not available for seller' };
    }

    // Get message from template
    const message = getMessageTemplate('sellerApproval', sellerData, {
        appUrl: waClientConfig.appUrl
    });
    
    console.log('[Notification] ✅ Message template generated for seller approval');
    console.log('[Notification] 📨 Complete message to be sent:');
    console.log('[Notification] ========================================');
    console.log(message);
    console.log('[Notification] ========================================');

    try {
        const result = await sendWhatsAppMessage(phoneNumber, message);
        return {
            success: true,
            message: 'Approval notification sent successfully',
            data: result.data
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to send approval notification',
            error: error.message
        };
    }
};

/**
 * Sends rejection notification to seller
 * @param {Object} sellerData - Seller data object
 * @returns {Promise<Object>} Notification result
 */
const sendSellerRejectionNotification = async (sellerData) => {
    console.log('[Notification] Attempting to send seller rejection notification');
    console.log('[Notification] WA Client enabled:', isWAClientEnabled());
    console.log('[Notification] Seller data:', { 
        vendorId: sellerData.vendor_id, 
        name: sellerData.firstname, 
        phone: sellerData.telephone 
    });

    if (!isWAClientEnabled()) {
        console.error('[Notification] WA Client is not enabled or not properly configured');
        return { success: false, message: 'WA Client is not enabled' };
    }

    const phoneNumber = sellerData.telephone;

    if (!phoneNumber) {
        console.error('[Notification] Phone number not available for seller:', sellerData.vendor_id);
        return { success: false, message: 'Phone number not available for seller' };
    }

    // Get message from template
    const message = getMessageTemplate('sellerRejection', sellerData, {
        appUrl: waClientConfig.appUrl
    });
    
    console.log('[Notification] ✅ Message template generated for seller rejection');
    console.log('[Notification] 📨 Complete message to be sent:');
    console.log('[Notification] ========================================');
    console.log(message);
    console.log('[Notification] ========================================');

    try {
        const result = await sendWhatsAppMessage(phoneNumber, message);
        return {
            success: true,
            message: 'Rejection notification sent successfully',
            data: result.data
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to send rejection notification',
            error: error.message
        };
    }
};

/**
 * Sends pending application notification to seller
 * @param {Object} sellerData - Seller data object
 * @returns {Promise<Object>} Notification result
 */
const sendSellerPendingNotification = async (sellerData) => {
    console.log('[Notification] Attempting to send seller pending notification');
    console.log('[Notification] WA Client enabled:', isWAClientEnabled());
    console.log('[Notification] Seller data:', { 
        id: sellerData.id,
        vendorId: sellerData.vendor_id, 
        name: sellerData.firstname, 
        phone: sellerData.telephone 
    });

    if (!isWAClientEnabled()) {
        console.error('[Notification] WA Client is not enabled or not properly configured');
        return { success: false, message: 'WA Client is not enabled' };
    }

    const phoneNumber = sellerData.telephone;

    if (!phoneNumber) {
        console.error('[Notification] Phone number not available for seller:', sellerData.vendor_id || sellerData.id);
        return { success: false, message: 'Phone number not available for seller' };
    }

    // Get message from template
    const message = getMessageTemplate('sellerPending', sellerData, {
        appUrl: waClientConfig.appUrl
    });
    
    console.log('[Notification] ✅ Message template generated for seller pending');
    console.log('[Notification] 📨 Complete message to be sent:');
    console.log('[Notification] ========================================');
    console.log(message);
    console.log('[Notification] ========================================');

    try {
        const result = await sendWhatsAppMessage(phoneNumber, message);
        return {
            success: true,
            message: 'Pending notification sent successfully',
            data: result.data
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to send pending notification',
            error: error.message
        };
    }
};

/**
 * Sends reel approval notification to influencer
 * @param {Object} reelData - Reel data object with influencer info
 * @returns {Promise<Object>} Notification result
 */
const sendInfluencerReelApprovalNotification = async (reelData) => {
    console.log('[Notification] ========================================');
    console.log('[Notification] Attempting to send influencer reel approval notification');
    console.log('[Notification] WA Client enabled:', isWAClientEnabled());
    console.log('[Notification] Full reel data received:', JSON.stringify(reelData, null, 2));
    console.log('[Notification] Reel data summary:', { 
        reel_id: reelData.reel_id, 
        title: reelData.title,
        influencer_id: reelData.influencer_id,
        name: reelData.firstname, 
        phone: reelData.telephone,
        email: reelData.email
    });

    if (!isWAClientEnabled()) {
        console.error('[Notification] ❌ WA Client is not enabled or not properly configured');
        return { success: false, message: 'WA Client is not enabled' };
    }

    const phoneNumber = reelData.telephone;

    if (!phoneNumber) {
        console.error('[Notification] ❌ Phone number not available for influencer reel:', reelData.reel_id);
        console.error('[Notification] Available fields:', Object.keys(reelData));
        return { success: false, message: 'Phone number not available for influencer reel' };
    }
    
    console.log('[Notification] ✅ Phone number found:', phoneNumber);

    // Get message from template
    const message = getMessageTemplate('influencerReelApproval', reelData, {
        appUrl: waClientConfig.appUrl
    });
    
    console.log('[Notification] ✅ Message template generated for influencer reel approval');
    console.log('[Notification] 📨 Complete message to be sent:');
    console.log('[Notification] ========================================');
    console.log(message);
    console.log('[Notification] ========================================');

    try {
        console.log('[Notification] Calling sendWhatsAppMessage with phone:', phoneNumber);
        const result = await sendWhatsAppMessage(phoneNumber, message);
        console.log('[Notification] sendWhatsAppMessage returned:', JSON.stringify(result, null, 2));
        return {
            success: true,
            message: 'Reel approval notification sent successfully',
            data: result.data
        };
    } catch (error) {
        console.error('[Notification] ❌ EXCEPTION in sendWhatsAppMessage for seller reel approval:');
        console.error('[Notification] Error type:', error.constructor.name);
        console.error('[Notification] Error message:', error.message);
        console.error('[Notification] Error stack:', error.stack);
        return {
            success: false,
            message: 'Failed to send reel approval notification',
            error: error.message
        };
    }
};

/**
 * Sends reel rejection notification to influencer
 * @param {Object} reelData - Reel data object with influencer info
 * @returns {Promise<Object>} Notification result
 */
const sendInfluencerReelRejectionNotification = async (reelData) => {
    console.log('[Notification] ========================================');
    console.log('[Notification] Attempting to send influencer reel rejection notification');
    console.log('[Notification] WA Client enabled:', isWAClientEnabled());
    console.log('[Notification] Full reel data received:', JSON.stringify(reelData, null, 2));
    console.log('[Notification] Reel data summary:', { 
        reel_id: reelData.reel_id, 
        title: reelData.title,
        influencer_id: reelData.influencer_id,
        name: reelData.firstname, 
        phone: reelData.telephone,
        email: reelData.email
    });

    if (!isWAClientEnabled()) {
        console.error('[Notification] ❌ WA Client is not enabled or not properly configured');
        return { success: false, message: 'WA Client is not enabled' };
    }

    const phoneNumber = reelData.telephone;

    if (!phoneNumber) {
        console.error('[Notification] ❌ Phone number not available for influencer reel:', reelData.reel_id);
        console.error('[Notification] Available fields:', Object.keys(reelData));
        return { success: false, message: 'Phone number not available for influencer reel' };
    }
    
    console.log('[Notification] ✅ Phone number found:', phoneNumber);

    // Get message from template
    const message = getMessageTemplate('influencerReelRejection', reelData, {
        appUrl: waClientConfig.appUrl
    });
    
    console.log('[Notification] ✅ Message template generated for influencer reel rejection');
    console.log('[Notification] 📨 Complete message to be sent:');
    console.log('[Notification] ========================================');
    console.log(message);
    console.log('[Notification] ========================================');

    try {
        console.log('[Notification] Calling sendWhatsAppMessage with phone:', phoneNumber);
        const result = await sendWhatsAppMessage(phoneNumber, message);
        console.log('[Notification] sendWhatsAppMessage returned:', JSON.stringify(result, null, 2));
        return {
            success: true,
            message: 'Reel rejection notification sent successfully',
            data: result.data
        };
    } catch (error) {
        console.error('[Notification] ❌ EXCEPTION in sendWhatsAppMessage for seller reel rejection:');
        console.error('[Notification] Error type:', error.constructor.name);
        console.error('[Notification] Error message:', error.message);
        console.error('[Notification] Error stack:', error.stack);
        return {
            success: false,
            message: 'Failed to send reel rejection notification',
            error: error.message
        };
    }
};

/**
 * Sends reel approval notification to seller
 * @param {Object} reelData - Reel data object with seller info
 * @returns {Promise<Object>} Notification result
 */
const sendSellerReelApprovalNotification = async (reelData) => {
    console.log('[Notification] 🔔🔔🔔 FUNCTION CALLED: sendSellerReelApprovalNotification');
    console.log('[Notification] ⏰ Timestamp:', new Date().toISOString());
    console.log('[Notification] ========================================');
    console.log('[Notification] Attempting to send seller reel approval notification');
    console.log('[Notification] WA Client enabled:', isWAClientEnabled());
    console.log('[Notification] Full reel data received:', JSON.stringify(reelData, null, 2));
    console.log('[Notification] Reel data summary:', { 
        reel_id: reelData.reel_id, 
        title: reelData.title,
        vendor_id: reelData.vendor_id,
        name: reelData.firstname, 
        phone: reelData.telephone,
        email: reelData.email
    });

    if (!isWAClientEnabled()) {
        console.error('[Notification] ❌ WA Client is not enabled or not properly configured');
        return { success: false, message: 'WA Client is not enabled' };
    }

    const phoneNumber = reelData.telephone;

    if (!phoneNumber) {
        console.error('[Notification] ❌ Phone number not available for seller reel:', reelData.reel_id);
        console.error('[Notification] Available fields:', Object.keys(reelData));
        return { success: false, message: 'Phone number not available for seller reel' };
    }
    
    console.log('[Notification] ✅ Phone number found:', phoneNumber);

    // Get message from template
    const message = getMessageTemplate('sellerReelApproval', reelData, {
        appUrl: waClientConfig.appUrl
    });
    
    console.log('[Notification] ✅ Message template generated for seller reel approval');
    console.log('[Notification] 📨 Complete message to be sent:');
    console.log('[Notification] ========================================');
    console.log(message);
    console.log('[Notification] ========================================');

    try {
        console.log('[Notification] Calling sendWhatsAppMessage with phone:', phoneNumber);
        const result = await sendWhatsAppMessage(phoneNumber, message);
        console.log('[Notification] sendWhatsAppMessage returned:', JSON.stringify(result, null, 2));
        return {
            success: true,
            message: 'Reel approval notification sent successfully',
            data: result.data
        };
    } catch (error) {
        console.error('[Notification] ❌ EXCEPTION in sendWhatsAppMessage for seller reel approval:');
        console.error('[Notification] Error type:', error.constructor.name);
        console.error('[Notification] Error message:', error.message);
        console.error('[Notification] Error stack:', error.stack);
        return {
            success: false,
            message: 'Failed to send reel approval notification',
            error: error.message
        };
    }
};

/**
 * Sends reel rejection notification to seller
 * @param {Object} reelData - Reel data object with seller info
 * @returns {Promise<Object>} Notification result
 */
const sendSellerReelRejectionNotification = async (reelData) => {
    console.log('[Notification] 🔔🔔🔔 FUNCTION CALLED: sendSellerReelRejectionNotification');
    console.log('[Notification] ⏰ Timestamp:', new Date().toISOString());
    console.log('[Notification] ========================================');
    console.log('[Notification] Attempting to send seller reel rejection notification');
    console.log('[Notification] WA Client enabled:', isWAClientEnabled());
    console.log('[Notification] Full reel data received:', JSON.stringify(reelData, null, 2));
    console.log('[Notification] Reel data summary:', { 
        reel_id: reelData.reel_id, 
        title: reelData.title,
        vendor_id: reelData.vendor_id,
        name: reelData.firstname, 
        phone: reelData.telephone,
        email: reelData.email
    });

    if (!isWAClientEnabled()) {
        console.error('[Notification] ❌ WA Client is not enabled or not properly configured');
        return { success: false, message: 'WA Client is not enabled' };
    }

    const phoneNumber = reelData.telephone;

    if (!phoneNumber) {
        console.error('[Notification] ❌ Phone number not available for seller reel:', reelData.reel_id);
        console.error('[Notification] Available fields:', Object.keys(reelData));
        return { success: false, message: 'Phone number not available for seller reel' };
    }
    
    console.log('[Notification] ✅ Phone number found:', phoneNumber);

    // Get message from template
    const message = getMessageTemplate('sellerReelRejection', reelData, {
        appUrl: waClientConfig.appUrl
    });
    
    console.log('[Notification] ✅ Message template generated for seller reel rejection');
    console.log('[Notification] 📨 Complete message to be sent:');
    console.log('[Notification] ========================================');
    console.log(message);
    console.log('[Notification] ========================================');

    try {
        console.log('[Notification] Calling sendWhatsAppMessage with phone:', phoneNumber);
        const result = await sendWhatsAppMessage(phoneNumber, message);
        console.log('[Notification] sendWhatsAppMessage returned:', JSON.stringify(result, null, 2));
        return {
            success: true,
            message: 'Reel rejection notification sent successfully',
            data: result.data
        };
    } catch (error) {
        console.error('[Notification] ❌ EXCEPTION in sendWhatsAppMessage for influencer reel rejection:');
        console.error('[Notification] Error type:', error.constructor.name);
        console.error('[Notification] Error message:', error.message);
        console.error('[Notification] Error stack:', error.stack);
        return {
            success: false,
            message: 'Failed to send reel rejection notification',
            error: error.message
        };
    }
};

module.exports = {
    sendInfluencerApprovalNotification,
    sendInfluencerRejectionNotification,
    sendInfluencerPendingNotification,
    sendSellerApprovalNotification,
    sendSellerRejectionNotification,
    sendSellerPendingNotification,
    sendInfluencerReelApprovalNotification,
    sendInfluencerReelRejectionNotification,
    sendSellerReelApprovalNotification,
    sendSellerReelRejectionNotification,
    sendWhatsAppMessage
};

