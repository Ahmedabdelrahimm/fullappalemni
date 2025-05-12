const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = require('../db');


router.post('/', async (req, res) => {
    const { interview_date, interview_price, application_id } = req.body;

    try {

        const appCheck = await pool.query('SELECT * FROM Enrollment_Applications WHERE Application_ID = $1', [application_id]);
        if (appCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Application not found' });
        }

        const result = await pool.query(
            `INSERT INTO Interviews (Interview_Date, Interview_Price, Application_ID) 
             VALUES ($1, $2, $3) RETURNING *`,
            [interview_date, interview_price, application_id]
        );
        res.status(201).json({ "Status": "OK", "Message": "Record Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Interviews');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    pool.query("SELECT * FROM interviews where " + keyword + " = $1 order by interview_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for Interviews`);
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Interviews WHERE Interview_ID = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    const { interview_date, interview_price } = req.body;

    try {
        const result = await pool.query(
            `UPDATE Interviews SET 
                Interview_Date = $1, Interview_Price = $2 
             WHERE Interview_ID = $3 RETURNING *`,
            [interview_date, interview_price, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }
        res.json({ "Status": "OK", "Message": "Record is Updated Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Interviews WHERE Interview_ID = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }
        res.json({ message: 'Interview deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/application/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Interviews WHERE Application_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;