const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
    const {
        name, email, specialization,
        years_of_experience, rating,
        consultation_fees, institution_id
    } = req.body;

    try {

        const institutionCheck = await pool.query('SELECT * FROM Institutions WHERE Institution_ID = $1', [institution_id]);
        if (institutionCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Institution not found' });
        }


        const emailCheck = await pool.query('SELECT * FROM Advisors_Consultants WHERE Email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const result = await pool.query(
            `INSERT INTO Advisors_Consultants (
                Name, Email, Specialization, Years_of_Experience, 
                Rating, Consultation_Fees, Institution_ID
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, email, specialization, years_of_experience,
                rating, consultation_fees, institution_id]
        );
        res.status(201).json({ "Status": "OK", "Message": "Record Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Advisors_Consultants');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    pool.query("SELECT * FROM advisors_consultants where " + keyword + " = $1 order by advisor_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for Advisors`);
});
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Advisors_Consultants WHERE Advisor_ID = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Advisor not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    const {
        name, specialization, years_of_experience,
        rating, consultation_fees
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE Advisors_Consultants SET 
                Name = $1, Specialization = $2, Years_of_Experience = $3, 
                Rating = $4, Consultation_Fees = $5 
             WHERE Advisor_ID = $6 RETURNING *`,
            [name, specialization, years_of_experience,
                rating, consultation_fees, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Advisor not found' });
        }
        res.json({ "Status": "OK", "Message": "Record is Updated Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Advisors_Consultants WHERE Advisor_ID = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Advisor not found' });
        }
        res.json({ message: 'Advisor deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/institution/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Advisors_Consultants WHERE Institution_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;