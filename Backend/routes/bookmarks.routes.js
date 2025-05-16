const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get user's bookmarks
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.*, i.name, i.location, i.type, i.rating, img.image_url as profile_picture
            FROM bookmarks b
            JOIN institutions i ON b.institution_id = i.institution_id
            LEFT JOIN institution_images img ON i.institution_id = img.institution_id AND img.is_primary = true
            WHERE b.user_id = $1
            ORDER BY b.date_added DESC
        `, [req.query.user_id]);

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
router.post('/:institutionId', async (req, res) => {
    const { institutionId } = req.params;
    const userId = req.body.user_id;

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
router.delete('/:institutionId', async (req, res) => {
    const { institutionId } = req.params;
    const userId = req.query.user_id;

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