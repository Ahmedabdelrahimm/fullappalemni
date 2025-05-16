const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
    const { rating, comment, user_id, institution_id } = req.body;

    try {

        const userCheck = await pool.query('SELECT * FROM Users WHERE User_ID = $1', [user_id]);
        if (userCheck.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }


        const institutionCheck = await pool.query('SELECT * FROM Institutions WHERE Institution_ID = $1', [institution_id]);
        if (institutionCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Institution not found' });
        }

        const result = await pool.query(
            `INSERT INTO Reviews (Rating, Comment, User_ID, Institution_ID) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [rating, comment, user_id, institution_id]
        );
        res.status(201).json({ "Status": "OK", "Message": "Record Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Reviews');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    pool.query("SELECT * FROM reviews where " + keyword + " = $1 order by review_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for Reviews`);
});
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Reviews WHERE Review_ID = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    const { rating, comment } = req.body;

    try {
        const result = await pool.query(
            `UPDATE Reviews SET 
                Rating = $1, Comment = $2 
             WHERE Review_ID = $3 RETURNING *`,
            [rating, comment, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json({ "Status": "OK", "Message": "Record is Updated Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Reviews WHERE Review_ID = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/institution/:id', async (req, res) => {
    try {
        console.log(`Fetching reviews for institution ID: ${req.params.id}`);

        // Use lowercase table names to match the schema
        const result = await pool.query(`
            SELECT r.*, u.first_name, u.last_name, u.profile_picture 
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.institution_id = $1
            ORDER BY r.review_date DESC
        `, [req.params.id]);

        console.log(`Found ${result.rows.length} reviews`);

        // Log the first review for debugging
        if (result.rows.length > 0) {
            console.log('First review:', result.rows[0]);
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:institutionId/reviews', async (req, res) => {
    try {
        console.log(`Fetching reviews for institution ID (alternative route): ${req.params.institutionId}`);

        // Use lowercase table names to match the schema
        const result = await pool.query(`
            SELECT r.*, u.first_name, u.last_name, u.profile_picture 
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.institution_id = $1
            ORDER BY r.review_date DESC
        `, [req.params.institutionId]);

        console.log(`Found ${result.rows.length} reviews`);

        // Log the first review for debugging
        if (result.rows.length > 0) {
            console.log('First review:', result.rows[0]);
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/user/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Reviews WHERE User_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a test endpoint to check if reviews are being returned
router.get('/test/:id', async (req, res) => {
    try {
        console.log(`Testing reviews for institution ID: ${req.params.id}`);

        // First check if the institution exists
        const institutionCheck = await pool.query('SELECT * FROM institutions WHERE institution_id = $1', [req.params.id]);

        if (institutionCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Institution not found',
                message: `No institution found with ID ${req.params.id}`
            });
        }

        // Check if there are any reviews for this institution
        const reviewCount = await pool.query('SELECT COUNT(*) FROM reviews WHERE institution_id = $1', [req.params.id]);

        console.log(`Found ${reviewCount.rows[0].count} reviews for institution ${req.params.id}`);

        // Get the reviews with user information
        const result = await pool.query(`
            SELECT r.*, u.first_name, u.last_name, u.profile_picture 
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.user_id
            WHERE r.institution_id = $1
            ORDER BY r.review_date DESC
        `, [req.params.id]);

        res.json({
            institution_id: req.params.id,
            review_count: parseInt(reviewCount.rows[0].count),
            reviews: result.rows
        });
    } catch (err) {
        console.error('Error in test reviews endpoint:', err);
        res.status(500).json({
            error: err.message,
            stack: err.stack
        });
    }
});

module.exports = router;
