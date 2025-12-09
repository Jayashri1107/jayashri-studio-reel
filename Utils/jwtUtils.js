const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'ipshopy-crm-secret-key';
    const expires = process.env.JWT_EXPIRES_IN || '24h';
    return jwt.sign(payload, secret, { expiresIn: expires });
};

// Generate JWT token with custom expiry (useful for password reset)
const generateResetToken = (payload, expiresIn = '1h') => {
    const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'ipshopy-crm-secret-key';
    return jwt.sign(payload, secret, { expiresIn });
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'ipshopy-crm-secret-key';
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
