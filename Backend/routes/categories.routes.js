const express = require('express');
const db = require('../db.js');
require('dotenv').config();

const router = express.Router();

// Helper function for handling database errors
const handleDatabaseError = (err, res) => {
    console.error('Database error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
};

// Get all categories
router.get('/', async (req, res) => {
    const client = await db.connect();
    try {
        const result = await client.query(
            'SELECT * FROM institution_categories ORDER BY category_name'
        );
        res.json({
            status: "OK",
            data: result.rows
        });
    } catch (err) {
        handleDatabaseError(err, res);
    } finally {
        client.release();
    }
});

// Get institutions by category
router.get('/:categoryId/institutions', async (req, res) => {
    const client = await db.connect();
    try {
        const { categoryId } = req.params;
        const result = await client.query(
            `SELECT i.* FROM institutions i
            JOIN institution_category_mappings m ON i.institution_id = m.institution_id
            WHERE m.category_id = $1`,
            [categoryId]
        );
        res.json({
            status: "OK",
            data: result.rows
        });
    } catch (err) {
        handleDatabaseError(err, res);
    } finally {
        client.release();
    }
});

module.exports = router; 