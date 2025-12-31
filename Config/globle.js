// Global configuration file
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'ipshopy-crm-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};
