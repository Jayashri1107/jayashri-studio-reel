/**
 * WhatsApp Message Templates
 * Customizable templates for all notification scenarios
 */

/**
 * Gets the application details section for messages
 * @param {Object} userData - User data object
 * @param {string} userType - 'seller' or 'influencer'
 * @returns {string} Formatted application details
 */
const getApplicationDetails = (userData, userType) => {
    const { firstname, lastname, telephone, email } = userData;
    const fullName = [firstname, lastname].filter(Boolean).join(' ') || firstname || userType;
    
    let details = `*Application Details:*
• Name: ${fullName}
• Phone: ${telephone || 'N/A'}
• Email: ${email || 'N/A'}`;
    
    if (userType === 'seller' && userData.vendor_id) {
        details += `\n• Vendor ID: ${userData.vendor_id}`;
    }
    
    if (userType === 'influencer' && userData.id) {
        details += `\n• Application ID: ${userData.id}`;
    }
    
    return details;
};

/**
 * Gets the full name from user data
 * @param {Object} userData - User data object
 * @returns {string} Full name
 */
const getFullName = (userData) => {
    const { firstname, lastname } = userData;
    return [firstname, lastname].filter(Boolean).join(' ') || firstname || 'User';
};

/**
 * Message Templates Configuration
 */
const messageTemplates = {
    /**
     * Influencer Approval Template
     */
    influencerApproval: (userData, config) => {
        const fullName = getFullName(userData);
        const appDetails = getApplicationDetails(userData, 'influencer');
        
        return `🎉 *Congratulations ${fullName}!*

Your influencer application for *IPShopy Studio* has been *APPROVED*!

${appDetails}
• Status: ✅ Approved

You can now access your dashboard and start creating reels.

*Login here:* ${config.appUrl}/studio/login

Thank you for being part of our community! 🌟`;
    },

    /**
     * Influencer Rejection Template
     */
    influencerRejection: (userData, config) => {
        const fullName = getFullName(userData);
        const appDetails = getApplicationDetails(userData, 'influencer');
        
        return `Hello *${fullName}*,

We regret to inform you that your influencer application for *IPShopy Studio* has been *REJECTED*.

${appDetails}
• Status: ❌ Rejected

If you have any questions or would like to reapply, please contact our support team.

Thank you for your interest in IPShopy Studio.`;
    },

    /**
     * Influencer Pending Template
     */
    influencerPending: (userData, config) => {
        const fullName = getFullName(userData);
        const appDetails = getApplicationDetails(userData, 'influencer');
        
        return `Hello *${fullName}*,

Thank you for applying to *IPShopy Studio*! 🙏

Your influencer application has been received and is currently *UNDER REVIEW*.

${appDetails}
• Status: ⏳ Pending Review

We will notify you once your application has been reviewed. This usually takes 24-48 hours.

*Check your application status:* ${config.appUrl}/studio/login

Thank you for your patience!`;
    },

    /**
     * Seller Approval Template
     */
    sellerApproval: (userData, config) => {
        const fullName = getFullName(userData);
        const appDetails = getApplicationDetails(userData, 'seller');
        
        return `🎉 *Congratulations ${fullName}!*

Your seller application for *IPShopy Studio* has been *APPROVED*!

${appDetails}
• Status: ✅ Approved

You can now access your dashboard and start uploading reels.

*Login here:* ${config.appUrl}/studio/login

Thank you for being part of our community! 🌟`;
    },

    /**
     * Seller Rejection Template
     */
    sellerRejection: (userData, config) => {
        const fullName = getFullName(userData);
        const appDetails = getApplicationDetails(userData, 'seller');
        
        return `Hello *${fullName}*,

We regret to inform you that your seller application for *IPShopy Studio* has been *REJECTED*.

${appDetails}
• Status: ❌ Rejected

If you have any questions or would like to reapply, please contact our support team.

Thank you for your interest in IPShopy Studio.`;
    },

    /**
     * Seller Pending Template
     */
    sellerPending: (userData, config) => {
        const fullName = getFullName(userData);
        const appDetails = getApplicationDetails(userData, 'seller');
        
        return `Hello *${fullName}*,

Thank you for applying to *IPShopy Studio*! 🙏

Your seller application has been received and is currently *UNDER REVIEW*.

${appDetails}
• Status: ⏳ Pending Review

We will notify you once your application has been reviewed. This usually takes 24-48 hours.

*Check your application status:* ${config.appUrl}/studio/login

Thank you for your patience!`;
    },

    /**
     * Influencer Reel Approval Template
     */
    influencerReelApproval: (reelData, config) => {
        const fullName = getFullName(reelData);
        const reelTitle = reelData.title || 'your reel';
        
        return `🎉 *Congratulations ${fullName}!*

Your reel "*${reelTitle}*" for *IPShopy Studio* has been *APPROVED*!

*Reel Details:*
• Reel Title: ${reelTitle}
• Reel ID: ${reelData.reel_id || 'N/A'}
• Status: ✅ Approved
• Your Name: ${fullName}
• Phone: ${reelData.telephone || 'N/A'}
• Email: ${reelData.email || 'N/A'}

Your reel is now live and visible to viewers.

*View your reel:* ${config.appUrl}/influencers/reels/view/${reelData.reel_id || ''}

Thank you for creating great content! 🌟`;
    },

    /**
     * Influencer Reel Rejection Template
     */
    influencerReelRejection: (reelData, config) => {
        const fullName = getFullName(reelData);
        const reelTitle = reelData.title || 'your reel';
        
        return `Hello *${fullName}*,

We regret to inform you that your reel "*${reelTitle}*" for *IPShopy Studio* has been *REJECTED*.

*Reel Details:*
• Reel Title: ${reelTitle}
• Reel ID: ${reelData.reel_id || 'N/A'}
• Status: ❌ Rejected
• Your Name: ${fullName}
• Phone: ${reelData.telephone || 'N/A'}
• Email: ${reelData.email || 'N/A'}

If you have any questions or would like to submit a new reel, please contact our support team.

Thank you for your understanding.`;
    },

    /**
     * Seller Reel Approval Template
     */
    sellerReelApproval: (reelData, config) => {
        const fullName = getFullName(reelData);
        const reelTitle = reelData.title || 'your reel';
        
        return `🎉 *Congratulations ${fullName}!*

Your reel "*${reelTitle}*" for *IPShopy Studio* has been *APPROVED*!

*Reel Details:*
• Reel Title: ${reelTitle}
• Reel ID: ${reelData.reel_id || 'N/A'}
• Status: ✅ Approved
• Your Name: ${fullName}
• Phone: ${reelData.telephone || 'N/A'}
• Email: ${reelData.email || 'N/A'}
• Vendor ID: ${reelData.vendor_id || 'N/A'}

Your reel is now live and visible to viewers.

*View your reel:* ${config.appUrl}/sellers/reels/view/${reelData.reel_id || ''}

Thank you for creating great content! 🌟`;
    },

    /**
     * Seller Reel Rejection Template
     */
    sellerReelRejection: (reelData, config) => {
        const fullName = getFullName(reelData);
        const reelTitle = reelData.title || 'your reel';
        
        return `Hello *${fullName}*,

We regret to inform you that your reel "*${reelTitle}*" for *IPShopy Studio* has been *REJECTED*.

*Reel Details:*
• Reel Title: ${reelTitle}
• Reel ID: ${reelData.reel_id || 'N/A'}
• Status: ❌ Rejected
• Your Name: ${fullName}
• Phone: ${reelData.telephone || 'N/A'}
• Email: ${reelData.email || 'N/A'}
• Vendor ID: ${reelData.vendor_id || 'N/A'}

If you have any questions or would like to submit a new reel, please contact our support team.

Thank you for your understanding.`;
    }
};

/**
 * Gets a message template for a specific scenario
 * @param {string} templateName - Template name (e.g., 'influencerApproval', 'sellerRejection')
 * @param {Object} userData - User data object
 * @param {Object} config - Configuration object with appUrl
 * @returns {string} Formatted message
 */
const getMessageTemplate = (templateName, userData, config) => {
    const template = messageTemplates[templateName];
    
    if (!template) {
        console.error(`[Message Template] Template "${templateName}" not found. Available templates:`, Object.keys(messageTemplates));
        throw new Error(`Message template "${templateName}" not found`);
    }
    
    console.log(`[Message Template] Using template: ${templateName}`);
    console.log(`[Message Template] User data:`, {
        name: getFullName(userData),
        phone: userData.telephone,
        email: userData.email,
        type: userData.vendor_id ? 'seller' : 'influencer'
    });
    
    const message = template(userData, config);
    
    console.log(`[Message Template] Generated message length: ${message.length} characters`);
    console.log(`[Message Template] Message preview (first 200 chars): ${message.substring(0, 200)}...`);
    
    return message;
};

module.exports = {
    messageTemplates,
    getMessageTemplate,
    getFullName,
    getApplicationDetails
};

