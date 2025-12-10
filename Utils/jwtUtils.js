const jwt = require('jsonwebtoken');

// Generate JWT token
<<<<<<< HEAD
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../Config/globle');
const generateToken = (payload) => {
    const secret = JWT_SECRET;
    const expires = JWT_EXPIRES_IN;
=======
const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'ipshopy-crm-secret-key';
    const expires = process.env.JWT_EXPIRES_IN || '24h';
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
    return jwt.sign(payload, secret, { expiresIn: expires });
};

// Generate JWT token with custom expiry (useful for password reset)
const generateResetToken = (payload, expiresIn = '1h') => {
<<<<<<< HEAD
    const secret = JWT_SECRET;
=======
    const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'ipshopy-crm-secret-key';
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
    return jwt.sign(payload, secret, { expiresIn });
};

// Verify JWT token
const verifyToken = (token) => {
    try {
<<<<<<< HEAD
        const secret = JWT_SECRET;
=======
        const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'ipshopy-crm-secret-key';
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
