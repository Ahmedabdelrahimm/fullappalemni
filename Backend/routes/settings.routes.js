const express = require('express');
const router = express.Router();
const pool = require('../db');

// User Settings
router.post('/settings', async (req, res) => {
    try {
        const { user_id, language, theme, notification_preferences } = req.body;
        const newSettings = await pool.query(
            'INSERT INTO user_settings (user_id, language, theme, notifications_enabled, email_notifications) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, language, theme, notification_preferences, notification_preferences, notification_preferences]
        );
        res.json(newSettings.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/settings/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const settings = await pool.query(
            'SELECT * FROM user_settings WHERE user_id = $1',
            [user_id]
        );
        res.json(settings.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.put('/settings/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const { language, theme, notification_preferences } = req.body;
        const updatedSettings = await pool.query(
            'UPDATE user_settings SET language = $1, theme = $2, notifications_enabled = $3, email_notifications = $4 WHERE user_id = $5 RETURNING *',
            [language, theme, notification_preferences, notification_preferences, user_id]
        );
        res.json(updatedSettings.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Authentication Tokens
router.post('/auth-tokens', async (req, res) => {
    try {
        const { user_id, token, expires_at } = req.body;
        const newToken = await pool.query(
            'INSERT INTO authentication_tokens (user_id, token, expiry_date) VALUES ($1, $2, $3) RETURNING *',
            [user_id, token, expires_at]
        );
        res.json(newToken.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/auth-tokens/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const authToken = await pool.query(
            'SELECT * FROM authentication_tokens WHERE token = $1 AND is_valid = true AND expiry_date > NOW()',
            [token]
        );
        res.json(authToken.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Password Reset Tokens
router.post('/reset-tokens', async (req, res) => {
    try {
        const { user_id, token, expires_at } = req.body;
        const newToken = await pool.query(
            'INSERT INTO password_reset_tokens (user_id, token, expiry_date) VALUES ($1, $2, $3) RETURNING *',
            [user_id, token, expires_at]
        );
        res.json(newToken.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/reset-tokens/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const resetToken = await pool.query(
            'SELECT * FROM password_reset_tokens WHERE token = $1 AND is_used = false AND expiry_date > NOW()',
            [token]
        );
        res.json(resetToken.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.put('/reset-tokens/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const updatedToken = await pool.query(
            'UPDATE password_reset_tokens SET is_used = true WHERE token = $1 RETURNING *',
            [token]
        );
        res.json(updatedToken.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 