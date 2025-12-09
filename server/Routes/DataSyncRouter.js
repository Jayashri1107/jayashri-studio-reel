const express = require('express');
const router = express.Router();
const { syncData } = require('../Controller/DataSyncController');

// Route for syncing data from sagar to ipshopy_reels database
router.get('/sync', syncData);

module.exports = router;