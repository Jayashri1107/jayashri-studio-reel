// ValidationHelper.js
// Validation helper functions

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateRequired = (value) => {
    return value !== null && value !== undefined && value !== '';
};

const validateLength = (value, min, max) => {
    if (!value) return false;
    return value.length >= min && value.length <= max;
};

module.exports = {
    validateEmail,
    validateRequired,
    validateLength
};

