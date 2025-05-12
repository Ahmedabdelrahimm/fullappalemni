const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = require('../db');


router.post('/', async (req, res) => {
    const { document_type, user_id, application_id } = req.body;

    try {

        const userCheck = await pool.query('SELECT * FROM Users WHERE User_ID = $1', [user_id]);
        if (userCheck.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }


        if (application_id) {
            const appCheck = await pool.query('SELECT * FROM Enrollment_Applications WHERE Application_ID = $1', [application_id]);
            if (appCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Application not found' });
            }
        }

        const result = await pool.query(
            `INSERT INTO Documents (Document_Type, User_ID, Application_ID) 
             VALUES ($1, $2, $3) RETURNING *`,
            [document_type, user_id, application_id]
        );
        res.status(201).json({ "Status": "OK", "Message": "Record Added Successfully"  });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Documents');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    pool.query("SELECT * FROM documents where " + keyword + " = $1 order by document_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for Documents`);
});
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Documents WHERE Document_ID = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/user/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Documents WHERE User_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/application/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Documents WHERE Application_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Documents WHERE Document_ID = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json({ message: 'Document deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;