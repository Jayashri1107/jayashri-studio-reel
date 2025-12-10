const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 3189;

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
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Increase server timeout
server.setTimeout(10 * 60 * 1000); // 10 minutes

module.exports = app;