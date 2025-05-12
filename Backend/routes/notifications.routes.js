const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create notification
router.post('/', async (req, res) => {
    try {
        const { user_id, title, message, type, related_id } = req.body;
        const newNotification = await pool.query(
            'INSERT INTO Notifications (user_id, title, message, type, related_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, title, message, type, related_id]
        );
        res.json(newNotification.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get user notifications
router.get('/user/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const notifications = await pool.query(
            'SELECT * FROM Notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [user_id]
        );
        res.json(notifications.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get unread notifications
router.get('/unread/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const notifications = await pool.query(
            'SELECT * FROM Notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC',
            [user_id]
        );
        res.json(notifications.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read
router.put('/read/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedNotification = await pool.query(
            'UPDATE Notifications SET is_read = true WHERE notification_id = $1 RETURNING *',
            [id]
        );
        res.json(updatedNotification.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Mark all notifications as read
router.put('/read-all/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const updatedNotifications = await pool.query(
            'UPDATE Notifications SET is_read = true WHERE user_id = $1 RETURNING *',
            [user_id]
        );
        res.json(updatedNotifications.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 