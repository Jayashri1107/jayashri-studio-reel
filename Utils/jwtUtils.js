const jwt = require('jsonwebtoken');

// Generate JWT token
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../Config/globle');
const generateToken = (payload) => {
    const secret = JWT_SECRET;
    const expires = JWT_EXPIRES_IN;
    return jwt.sign(payload, secret, { expiresIn: expires });
};

// Generate JWT token with custom expiry (useful for password reset)
const generateResetToken = (payload, expiresIn = '1h') => {
    const secret = JWT_SECRET;
    return jwt.sign(payload, secret, { expiresIn });
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        const secret = JWT_SECRET;
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

module.exports = {
    generateToken,
    generateResetToken,
    verifyToken
};
