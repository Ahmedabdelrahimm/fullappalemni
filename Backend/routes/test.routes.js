const express = require('express');
const router = express.Router();

router.get('/ping', async (req, res) => {
    try {
        res.json({
            message: 'Backend is connected!',
            timestamp: new Date().toISOString(),
            status: 'success'
        });
    } catch (err) {
        console.error('Error in ping route:', err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: err.message
        });
    }
});

module.exports = router; 