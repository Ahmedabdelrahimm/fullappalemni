const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get user's bookmarks
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.*, i.name, i.location, i.type, i.rating, i.profile_picture
            FROM bookmarks b
            JOIN institutions i ON b.institution_id = i.institution_id
            WHERE b.user_id = $1
            ORDER BY b.date_added DESC
        `, [req.user.user_id]);

        res.json({
            success: true,
            bookmarks: result.rows
        });
    } catch (err) {
        console.error('Error fetching bookmarks:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: err.message
        });
    }
});

// Add bookmark
router.post('/:institutionId', authenticateToken, async (req, res) => {
    const { institutionId } = req.params;
    const userId = req.user.user_id;

    try {
        // Check if bookmark already exists
        const existingBookmark = await pool.query(
            'SELECT * FROM bookmarks WHERE user_id = $1 AND institution_id = $2',
            [userId, institutionId]
        );

        if (existingBookmark.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Bookmark already exists'
            });
        }

        // Add new bookmark
        const result = await pool.query(
            'INSERT INTO bookmarks (user_id, institution_id) VALUES ($1, $2) RETURNING *',
            [userId, institutionId]
        );

        res.status(201).json({
            success: true,
            message: 'Bookmark added successfully',
            bookmark: result.rows[0]
        });
    } catch (err) {
        console.error('Error adding bookmark:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: err.message
        });
    }
});

// Remove bookmark
router.delete('/:institutionId', authenticateToken, async (req, res) => {
    const { institutionId } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            'DELETE FROM bookmarks WHERE user_id = $1 AND institution_id = $2 RETURNING *',
            [userId, institutionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Bookmark not found'
            });
        }

        res.json({
            success: true,
            message: 'Bookmark removed successfully'
        });
    } catch (err) {
        console.error('Error removing bookmark:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: err.message
        });
    }
});

module.exports = router; 