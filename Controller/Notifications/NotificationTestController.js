/**
 * Notification Test Controller
 * Used for testing WhatsApp API connection and debugging notification issues
 */

const { sendWhatsAppMessage } = require('../../Services/Notifications/notificationService');
const { isWAClientEnabled, logConfigStatus, waClientConfig, getWAClientEndpoint } = require('../../Services/Notifications/waClientConfig');

// Test notification endpoint
const testNotification = async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }
        
        // Log configuration status
        console.log('\n=== TEST NOTIFICATION REQUEST ===');
        logConfigStatus();
        console.log('Test phone number:', phoneNumber);
        console.log('Test message:', message || 'Test message from IPShopy Studio');
        console.log('API Endpoint:', getWAClientEndpoint());
        console.log('WA Client Enabled:', isWAClientEnabled());
        console.log('==================================\n');
        
        if (!isWAClientEnabled()) {
            return res.status(400).json({
                success: false,
                message: 'WA Client is not enabled or not properly configured',
                config: {
                    enabled: waClientConfig.enabled,
                    notificationService: waClientConfig.notificationService,
                    hasInstanceId: !!waClientConfig.instanceId,
                    hasAccessToken: !!waClientConfig.accessToken,
                    hasApiUrl: !!waClientConfig.apiUrl,
                    hasSenderId: !!waClientConfig.senderId
                }
            });
        }
        
        const testMessage = message || '🧪 This is a test message from IPShopy Studio notification system.';
        
        const result = await sendWhatsAppMessage(phoneNumber, testMessage);
        
        return res.status(200).json({
            success: true,
            message: 'Test notification sent',
            result: result,
            config: {
                endpoint: getWAClientEndpoint(),
                instanceId: waClientConfig.instanceId,
                hasAccessToken: !!waClientConfig.accessToken,
                senderId: waClientConfig.senderId
            }
        });
        
    } catch (error) {
        console.error('Test notification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send test notification',
            error: error.message,
            stack: error.stack
        });
    }
};

// Get notification configuration status
const getNotificationStatus = async (req, res) => {
    try {
        const config = {
            enabled: waClientConfig.enabled,
            notificationService: waClientConfig.notificationService,
            instanceId: waClientConfig.instanceId,
            hasAccessToken: !!waClientConfig.accessToken,
            apiUrl: waClientConfig.apiUrl,
            senderId: waClientConfig.senderId,
            appUrl: waClientConfig.appUrl,
            endpoint: getWAClientEndpoint(),
            isEnabled: isWAClientEnabled()
        };
        
        return res.status(200).json({
            success: true,
            config: config
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get notification status',
            error: error.message
        });
    }
};

module.exports = {
    testNotification,
    getNotificationStatus
};

