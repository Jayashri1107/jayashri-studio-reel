/**
 * WhatsApp Client Configuration
 * Environment-based configuration for WA Client integration
 * Note: Values are read dynamically from process.env to ensure dotenv.config() has loaded
 */

// Get config values dynamically (not at module load time)
const getWaClientConfig = () => {
    return {
        enabled: process.env.WA_CLIENT_ENABLED === 'true',
        instanceId: process.env.WA_CLIENT_INSTANCE_ID || '',
        accessToken: process.env.WA_CLIENT_ACCESS_TOKEN || '',
        apiUrl: process.env.WA_CLIENT_API_URL || '',
        senderId: process.env.WA_CLIENT_SENDER_ID || '',
        appUrl: process.env.APP_URL || '',
        notificationService: process.env.NOTIFICATION_SERVICE || ''
    };
};

// For backward compatibility, keep a reference that updates dynamically
const waClientConfig = new Proxy({}, {
    get(target, prop) {
        const config = getWaClientConfig();
        return config[prop];
    }
});

/**
 * Validates if WA Client is properly configured and enabled
 * @returns {boolean} True if WA Client is enabled and properly configured
 */
const isWAClientEnabled = () => {
    const checks = {
        enabled: waClientConfig.enabled,
        notificationService: waClientConfig.notificationService === 'WA_CLIENT',
        instanceId: !!waClientConfig.instanceId,
        accessToken: !!waClientConfig.accessToken,
        apiUrl: !!waClientConfig.apiUrl,
        senderId: !!waClientConfig.senderId
    };
    
    const allPassed = Object.values(checks).every(check => check === true);
    
    if (!allPassed) {
        console.log('[WA Client Config] Configuration check failed. Details:');
        console.log('  - WA_CLIENT_ENABLED:', checks.enabled, `(value: "${process.env.WA_CLIENT_ENABLED}")`);
        console.log('  - NOTIFICATION_SERVICE === "WA_CLIENT":', checks.notificationService, `(value: "${process.env.NOTIFICATION_SERVICE}")`);
        console.log('  - WA_CLIENT_INSTANCE_ID exists:', checks.instanceId, `(value: "${waClientConfig.instanceId}")`);
        console.log('  - WA_CLIENT_ACCESS_TOKEN exists:', checks.accessToken, `(value: "${waClientConfig.accessToken ? '***hidden***' : ''}")`);
        console.log('  - WA_CLIENT_API_URL exists:', checks.apiUrl, `(value: "${waClientConfig.apiUrl}")`);
        console.log('  - WA_CLIENT_SENDER_ID exists:', checks.senderId, `(value: "${waClientConfig.senderId}")`);
    }
    
    return allPassed;
};

// Log configuration status (reads dynamically from process.env)
const logConfigStatus = () => {
    const config = getWaClientConfig();
    console.log('=== WhatsApp Notification Configuration ===');
    console.log('WA_CLIENT_ENABLED:', config.enabled, `(env: "${process.env.WA_CLIENT_ENABLED || 'undefined'}")`);
    console.log('NOTIFICATION_SERVICE:', config.notificationService, `(env: "${process.env.NOTIFICATION_SERVICE || 'undefined'}")`);
    console.log('WA_CLIENT_INSTANCE_ID:', config.instanceId ? '✓ Set' : '✗ Missing', `(env: "${process.env.WA_CLIENT_INSTANCE_ID || 'undefined'}")`);
    console.log('WA_CLIENT_ACCESS_TOKEN:', config.accessToken ? '✓ Set' : '✗ Missing', `(env: "${process.env.WA_CLIENT_ACCESS_TOKEN ? '***set***' : 'undefined'}")`);
    console.log('WA_CLIENT_API_URL:', config.apiUrl || '✗ Missing', `(env: "${process.env.WA_CLIENT_API_URL || 'undefined'}")`);
    console.log('WA_CLIENT_SENDER_ID:', config.senderId || '✗ Missing', `(env: "${process.env.WA_CLIENT_SENDER_ID || 'undefined'}")`);
    console.log('APP_URL:', config.appUrl || '✗ Missing', `(env: "${process.env.APP_URL || 'undefined'}")`);
    console.log('Notification Service Status:', isWAClientEnabled() ? '✓ ENABLED' : '✗ DISABLED');
    console.log('==========================================');
};

/**
 * Gets the WA Client API endpoint for sending messages
 * Some APIs use different endpoint structures:
 * - /send
 * - /send-message
 * - /message
 * - Query parameters instead of body
 * @returns {string} API endpoint URL
 */
/**
 * Gets the WA Client API endpoint for sending messages
 * Tries multiple common endpoint formats
 */
const getWAClientEndpoint = (format = 1) => {
    if (!waClientConfig.apiUrl) {
        return null;
    }
    // Remove trailing slash if present
    const baseUrl = waClientConfig.apiUrl.replace(/\/$/, '');
    
    // Different endpoint formats
    const endpoints = {
        1: `${baseUrl}/send`,           // Most common
        2: `${baseUrl}/send-message`,   // Alternative 1
        3: `${baseUrl}/message`,        // Alternative 2
        4: `${baseUrl}/sendMessage`,    // Alternative 3
        5: `${baseUrl}/api/send`        // Alternative 4
    };
    
    return endpoints[format] || endpoints[1];
};

/**
 * Try all endpoint formats
 */
const getAllWAClientEndpoints = () => {
    const endpoints = [];
    for (let i = 1; i <= 5; i++) {
        endpoints.push(getWAClientEndpoint(i));
    }
    return endpoints;
};

module.exports = {
    waClientConfig,
    isWAClientEnabled,
    getWAClientEndpoint,
    getAllWAClientEndpoints,
    logConfigStatus
};

