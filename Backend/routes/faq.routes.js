const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
    const { question, answer, category } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO FAQ_Help_Center (Question, Answer, Category) 
             VALUES ($1, $2, $3) RETURNING *`,
            [question, answer, category]
        );
        res.status(201).json({ "Status": "OK", "Message": "Record Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM FAQ_Help_Center');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    pool.query("SELECT * FROM faq_help_center where " + keyword + " = $1 order by faq_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for FAQs`);
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM FAQ_Help_Center WHERE FAQ_ID = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'FAQ not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    const { question, answer, category } = req.body;

    try {
        const result = await pool.query(
            `UPDATE FAQ_Help_Center SET 
                Question = $1, Answer = $2, Category = $3 
             WHERE FAQ_ID = $4 RETURNING *`,
            [question, answer, category, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'FAQ not found' });
        }
        res.json({ "Status": "OK", "Message": "Record is Updated Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM FAQ_Help_Center WHERE FAQ_ID = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'FAQ not found' });
        }
        res.json({ message: 'FAQ deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/category/:category', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM FAQ_Help_Center WHERE Category = $1', [req.params.category]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/popularity', async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE FAQ_Help_Center SET 
                Popularity = Popularity + 1 
             WHERE FAQ_ID = $1 RETURNING *`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'FAQ not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;