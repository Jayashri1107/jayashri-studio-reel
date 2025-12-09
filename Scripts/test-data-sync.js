// Test script for data synchronization
require('dotenv').config();
const { syncData } = require('../Controller/DataSyncController');

// Mock request and response objects for testing
const req = {};
const res = {
    status: function(code) {
        this.statusCode = code;
        return this;
    },
    json: function(data) {
        console.log(`Status: ${this.statusCode}`);
        console.log('Response:', JSON.stringify(data, null, 2));
    }
};

// Run the sync function
console.log('Testing data synchronization...');
syncData(req, res);