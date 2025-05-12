const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = require('../db');


router.post('/', async (req, res) => {
    const { course_name, instructor, credits, duration, course_description, program_id } = req.body;

    try {

        const programCheck = await pool.query('SELECT * FROM Educational_Programs WHERE Program_ID = $1', [program_id]);
        if (programCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Program not found' });
        }

        const result = await pool.query(
            `INSERT INTO Courses (Course_Name, Instructor, Credits, Duration, Course_Description, Program_ID) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [course_name, instructor, credits, duration, course_description, program_id]
        );
        res.status(201).json({ "Status": "OK", "Message": "Record Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Courses');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    pool.query("SELECT * FROM courses where " + keyword + " = $1 order by course_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for Courses`);
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Courses WHERE Course_ID = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    const { course_name, instructor, credits, duration, course_description, program_id } = req.body;

    try {
        const result = await pool.query(
            `UPDATE Courses SET 
                Course_Name = $1, Instructor = $2, Credits = $3, 
                Duration = $4, Course_Description = $5, Program_ID = $6 
             WHERE Course_ID = $7 RETURNING *`,
            [course_name, instructor, credits, duration, course_description, program_id, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ "Status": "OK", "Message": "Record is Updated Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Courses WHERE Course_ID = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/program/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Courses WHERE Program_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;