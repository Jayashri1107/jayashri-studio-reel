const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'ipshopy-crm-secret-key';

// Middleware to verify JWT token and ensure user has ADMIN role
const Auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify that the user has admin role (user_group_id = 1)
    if (decoded.role !== 1 && decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.' 
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.' 
    });
  }
};

// Middleware to verify JWT token and ensure user is an influencer
const verifyInfluencer = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify that the user has influencer role (user_group_id = 3)
    if (decoded.role !== 3 && decoded.role !== 'influencer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Influencer role required.' 
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.' 
    });
  }
};

// Middleware to verify JWT token and ensure user is a seller
const verifySeller = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify that the user has seller role (user_group_id = 2)
    if (decoded.role !== 2 && decoded.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Seller role required.' 
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.' 
    });
  }
};

// Middleware to verify JWT token (any authenticated user)
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.' 
    });
  }
};

module.exports = {
  Auth,
  verifyInfluencer,
  verifySeller,
  verifyToken
};
