const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Re-log notification config after dotenv loads (if notification module is loaded)
try {
    const { logConfigStatus } = require('./Services/Notifications/waClientConfig');
    if (logConfigStatus) {
        console.log('\n=== Re-checking WhatsApp Notification Configuration (after dotenv) ===');
        logConfigStatus();
    }
} catch (error) {
    // Module might not be loaded yet, that's okay
}

// Initialize app
const app = express();
const PORT = process.env.PORT || 3189;
const AZURE_SAS_DISABLED = String(process.env.AZURE_SAS_DISABLED || '').toLowerCase() === 'true';
const SAS_ENV_KEYS = [
    'AZURE_BLOB_SAS_QUERY',
    'AZURE_BLOB_SAS_TOKEN',
    'AZURE_STORAGE_SAS',
    'AZURE_SAS_TOKEN'
];
const resolveSasToken = () => {
    for (const key of SAS_ENV_KEYS) {
        const value = process.env[key];
        if (value && String(value).trim()) {
            return { token: String(value).trim(), source: key };
        }
    }
    return { token: '', source: '' };
};

// ================================
// ✅ CORS (MUST BE VERY FIRST)
// ================================
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    credentials: true
}));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// ================================
// 🚀 BODY PARSING MIDDLEWARE
// Must be loaded before any routes that need to parse request bodies
// ================================
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// ================================
// ⏱️ SERVER TIMEOUT CONFIGURATION
// Increase timeout for file uploads
// ================================
app.use((req, res, next) => {
    // Set server timeout to 10 minutes for file uploads
    req.setTimeout(10 * 60 * 1000); // 10 minutes
    res.setTimeout(10 * 60 * 1000); // 10 minutes
    next();
});

// ================================
// 📌 ROUTES IMPORTS
// ================================
const UsersRouter = require('./Routes/UsersRouter');
const CategoriesRouter = require('./Routes/CategoriesRouter');
const DataSyncRouter = require('./Routes/DataSyncRouter');
const EmployeesRouter = require('./Routes/EmployeesRouter');
const UserGroupsRouter = require("./Routes/UserGroupsRouter");
const MastersRouter = require('./Routes/MastersRouter');
const SellerApprovalRouter = require('./Routes/SellerApprovalRouter');
const SellerRegistrationRouter = require('./Routes/SellerRegistrationRouter');
const StudioRouter = require('./Routes/StudioRouter');
const StudioReelsRouter = require('./Routes/StudioReelsRouter');
const NotificationTestRouter = require('./Routes/NotificationTestRouter');

// ================================
// 📌 ROUTES - Apply in proper order
// ================================
app.use('/Users', UsersRouter);
app.use('/Categories', CategoriesRouter);
app.use('/DataSync', DataSyncRouter);
app.use('/Employees', EmployeesRouter);
app.use('/user-groups', UserGroupsRouter);
app.use('/Masters', MastersRouter);
app.use('/SellerRegistration', SellerRegistrationRouter);
app.use('/Studio', StudioRouter);
app.use('/api/studio/reels', StudioReelsRouter);   // 🔥 File upload (multer)
app.use('/SellerApproval', SellerApprovalRouter);
app.use('/NotificationTest', NotificationTestRouter); // Test notification endpoints 

// ================================
// 📌 HEALTH CHECK
// ================================
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ================================
// ❌ 404 HANDLER
// ================================
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// ================================
// ❗ GLOBAL ERROR HANDLER
// ================================
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// ================================
// 🚀 START SERVER
// ================================
// Validate Azure SAS token on startup (only if Azure storage is being used)
const validateAzureSAS = () => {
    // Check if Azure storage is being used (check for Azure upload URL or storage type)
    const storageType = process.env.STORAGE_TYPE || 'azure'; // Default to azure
    const azureUploadUrl = process.env.AZURE_UPLOAD_URL;
    
    // If using local storage, skip SAS token validation
    if (storageType === 'local' && !azureUploadUrl) {
        console.log('ℹ️  Using local storage - SAS token validation skipped');
        return true;
    }

    if (AZURE_SAS_DISABLED) {
        console.log('ℹ️  AZURE_SAS_DISABLED=true - skipping SAS validation (expects public blob access)');
        return true;
    }
    
    const { token: sas, source } = resolveSasToken();
    if (!sas || !sas.trim()) {
        console.warn('\n⚠️  WARNING: Azure SAS token is not set!');
        console.warn('   Azure video URLs will not load without a valid SAS token unless blobs are public.');
        console.warn('   If using Azure with private blobs, set one of:', SAS_ENV_KEYS.join(', '));
        console.warn('   If using public access, set AZURE_SAS_DISABLED=true to silence this warning.');
        console.warn('   If you are using local storage, set STORAGE_TYPE=local to suppress this warning.\n');
        return false;
    }
    
    // Check if token has required parameters
    const cleanSas = String(sas).trim().replace(/^\?/, '');
    if (!cleanSas.includes('sv=') || !cleanSas.includes('sig=')) {
        console.warn('\n⚠️  WARNING: Azure SAS token format may be invalid!');
        console.warn('   Token should contain: ?sv=...&sig=...');
        console.warn('   Please verify your SAS token format.\n');
        return false;
    }
    
    // Check expiration date
    const expiryMatch = cleanSas.match(/se=([^&]+)/);
    if (expiryMatch) {
        try {
            const expiryDate = new Date(decodeURIComponent(expiryMatch[1]));
            const now = new Date();
            
            if (expiryDate < now) {
                console.error('\n❌ CRITICAL ERROR: SAS token has EXPIRED!');
                console.error(`   Expiry date: ${expiryDate.toISOString()}`);
                console.error('   Videos will NOT load until you generate a new token.');
                console.error('   Please generate a new SAS token in Azure Portal and update .env file.\n');
                return false;
            }
            
            const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry < 30) {
                console.warn(`\n⚠️  WARNING: SAS token expires in ${daysUntilExpiry} days (${expiryDate.toISOString()})`);
                console.warn('   Consider generating a new long-lived token to avoid expiration issues.\n');
            } else {
                console.log(`✅ Azure SAS token is valid (expires in ${daysUntilExpiry} days, source: ${source || 'unknown'})`);
            }
            return true;
        } catch (e) {
            console.warn('\n⚠️  WARNING: Could not parse SAS token expiry date');
            console.warn('   Token may still work, but expiration cannot be verified.\n');
            return true; // Assume valid if we can't parse
        }
    } else {
        console.warn('\n⚠️  WARNING: SAS token does not contain expiry date (se= parameter)');
        console.warn('   Token may still work, but expiration cannot be verified.\n');
        return true; // Assume valid if no expiry date
    }
};

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log('\n=== Azure Configuration Check ===');
    validateAzureSAS();
    console.log('================================\n');
});

// Increase server timeout
server.setTimeout(10 * 60 * 1000); // 10 minutes

module.exports = app;