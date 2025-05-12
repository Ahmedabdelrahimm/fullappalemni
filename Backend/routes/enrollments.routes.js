const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
    const { user_id, program_id, status, required_documents } = req.body;

    try {

        const userCheck = await pool.query('SELECT * FROM Users WHERE User_ID = $1', [user_id]);
        if (userCheck.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }


        const programCheck = await pool.query('SELECT * FROM Educational_Programs WHERE Program_ID = $1', [program_id]);
        if (programCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Program not found' });
        }

        const result = await pool.query(
            `INSERT INTO Enrollment_Applications (User_ID, Program_ID, Status, Required_Documents) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, program_id, status || 'pending', required_documents]
        );
        res.status(201).json({ "Status": "OK", "Message": "Record Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Enrollment_Applications');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    pool.query("SELECT * FROM enrollment_applications where " + keyword + " = $1 order by application_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for Enrollments`);
});
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Enrollment_Applications WHERE Application_ID = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    const { status, required_documents } = req.body;

    try {
        const result = await pool.query(
            `UPDATE Enrollment_Applications SET 
                Status = $1, Required_Documents = $2 
             WHERE Application_ID = $3 RETURNING *`,
            [status, required_documents, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ "Status": "OK", "Message": "Record is Updated Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Enrollment_Applications WHERE Application_ID = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json({ message: 'Application deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/user/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Enrollment_Applications WHERE User_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/program/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Enrollment_Applications WHERE Program_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;