const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../Config/globle');

// Middleware to verify JWT token and ensure user has ADMIN role
const Auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader ? (authHeader.includes(' ') ? authHeader.split(' ')[1] : authHeader) : undefined)
      || req.headers.token
      || req.headers['x-auth-token']
      || req.headers['x-access-token'];
    console.log('Auth middleware', req.method, req.originalUrl, token ? 'token present' : 'token missing');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Auth decoded', decoded?.id, decoded?.role);
    
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
    console.log('Auth error', req.method, req.originalUrl, error.name, error.message);
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
    const authHeader = req.headers.authorization;
    const token = (authHeader ? (authHeader.includes(' ') ? authHeader.split(' ')[1] : authHeader) : undefined)
      || req.headers.token
      || req.headers['x-auth-token']
      || req.headers['x-access-token'];
    console.log('verifyInfluencer', req.method, req.originalUrl, token ? 'token present' : 'token missing');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Influencer decoded', decoded?.id, decoded?.role);
    
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
    console.log('Influencer error', req.method, req.originalUrl, error.name, error.message);
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
    const authHeader = req.headers.authorization;
    const token = (authHeader ? (authHeader.includes(' ') ? authHeader.split(' ')[1] : authHeader) : undefined)
      || req.headers.token
      || req.headers['x-auth-token']
      || req.headers['x-access-token'];
    console.log('verifySeller', req.method, req.originalUrl, token ? 'token present' : 'token missing');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Seller decoded', decoded?.id, decoded?.role);
    
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
    console.log('Seller error', req.method, req.originalUrl, error.name, error.message);
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
    const authHeader = req.headers.authorization;
    const token = (authHeader ? (authHeader.includes(' ') ? authHeader.split(' ')[1] : authHeader) : undefined)
      || req.headers.token
      || req.headers['x-auth-token']
      || req.headers['x-access-token'];
    console.log('verifyToken', req.method, req.originalUrl, token ? 'token present' : 'token missing');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded', decoded?.id, decoded?.role);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token error', req.method, req.originalUrl, error.name, error.message);
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
