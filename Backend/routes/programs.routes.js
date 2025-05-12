const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = require('../db');
router.post('/', async (req, res) => {
    const { duration, tuition_fees, program_name, level, curriculum_details, institution_id } = req.body;

    try {

        const institutionCheck = await pool.query('SELECT * FROM Institutions WHERE Institution_ID = $1', [institution_id]);
        if (institutionCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Institution not found' });
        }

        const result = await pool.query(
            `INSERT INTO Educational_Programs (Duration, Tuition_Fees, Program_Name, Level, Curriculum_Details, Institution_ID) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [duration, tuition_fees, program_name, level, curriculum_details, institution_id]
        );
        res.status(201).json({ "Status": "OK", "Message": "Record Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Educational_Programs');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    pool.query("SELECT * FROM educational_programs where " + keyword + " = $1 order by program_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for Programs`);
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Educational_Programs WHERE Program_ID = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    const { duration, tuition_fees, program_name, level, curriculum_details, institution_id } = req.body;

    try {
        const result = await pool.query(
            `UPDATE Educational_Programs SET 
                Duration = $1, Tuition_Fees = $2, Program_Name = $3, 
                Level = $4, Curriculum_Details = $5, Institution_ID = $6 
             WHERE Program_ID = $7 RETURNING *`,
            [duration, tuition_fees, program_name, level, curriculum_details, institution_id, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }
        res.json({ "Status": "OK", "Message": "Record is Updated Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Educational_Programs WHERE Program_ID = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }
        res.json({ message: 'Program deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/institution/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Educational_Programs WHERE Institution_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;