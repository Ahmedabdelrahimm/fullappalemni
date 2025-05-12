const express = require('express');
const router = express.Router();
const pool = require('../db');

// Community Rooms
router.post('/rooms', async (req, res) => {
    try {
        const { name, description } = req.body;
        const newRoom = await pool.query(
            'INSERT INTO Community_Rooms (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.json(newRoom.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/rooms', async (req, res) => {
    try {
        const rooms = await pool.query('SELECT * FROM Community_Rooms ORDER BY created_date DESC');
        res.json(rooms.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/rooms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const room = await pool.query('SELECT * FROM Community_Rooms WHERE room_id = $1', [id]);
        res.json(room.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Community Memberships
router.post('/memberships', async (req, res) => {
    try {
        const { user_id, room_id } = req.body;
        const newMembership = await pool.query(
            'INSERT INTO Community_Memberships (user_id, room_id) VALUES ($1, $2) RETURNING *',
            [user_id, room_id]
        );
        res.json(newMembership.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/memberships/:room_id', async (req, res) => {
    try {
        const { room_id } = req.params;
        const memberships = await pool.query(
            'SELECT * FROM Community_Memberships WHERE room_id = $1',
            [room_id]
        );
        res.json(memberships.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Community Messages
router.post('/messages', async (req, res) => {
    try {
        const { room_id, user_id, content } = req.body;
        const newMessage = await pool.query(
            'INSERT INTO Community_Messages (room_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
            [room_id, user_id, content]
        );
        res.json(newMessage.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/messages/:room_id', async (req, res) => {
    try {
        const { room_id } = req.params;
        const messages = await pool.query(
            'SELECT * FROM Community_Messages WHERE room_id = $1 ORDER BY timestamp DESC',
            [room_id]
        );
        res.json(messages.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 