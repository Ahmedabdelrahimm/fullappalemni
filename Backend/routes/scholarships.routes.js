const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = require('../db');
router.post('/', async (req, res) => {
    const { application_deadline, scholarship_amount, eligibility_criteria, scholarship_name, institution_id } = req.body;

    try {

        const institutionCheck = await pool.query('SELECT * FROM Institutions WHERE Institution_ID = $1', [institution_id]);
        if (institutionCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Institution not found' });
        }

        const result = await pool.query(
            `INSERT INTO Scholarships (Application_Deadline, Scholarship_Amount, Eligibility_Criteria, Scholarship_Name, Institution_ID) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [application_deadline, scholarship_amount, eligibility_criteria, scholarship_name, institution_id]
        );
        res.status(201).json({ "Status": "OK", "Message": "Record Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Scholarships');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    pool.query("SELECT * FROM scholarships where " + keyword + " = $1 order by scholarship_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for Scholarships`);
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Scholarships WHERE Scholarship_ID = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Scholarship not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    const { application_deadline, scholarship_amount, eligibility_criteria, scholarship_name, institution_id } = req.body;

    try {
        const result = await pool.query(
            `UPDATE Scholarships SET 
                scholarship_name = COALESCE($1, scholarship_name),
                scholarship_amount = COALESCE($2, scholarship_amount),
                eligibility_criteria = COALESCE($3, eligibility_criteria)
             WHERE scholarship_id = $4 RETURNING *`,
            [scholarship_name, scholarship_amount, eligibility_criteria, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Scholarship not found' });
        }
        res.json({ "Status": "OK", "Message": "Record is Updated Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Scholarships WHERE Scholarship_ID = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Scholarship not found' });
        }
        res.json({ message: 'Scholarship deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/institution/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Scholarships WHERE Institution_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;