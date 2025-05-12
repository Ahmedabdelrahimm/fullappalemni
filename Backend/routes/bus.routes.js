const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
    const {
        dropoff_time, pickup_time, pickup_location,
        end_location, start_location, bus_fees,
        stops, route_name, institution_id
    } = req.body;

    try {
        const institutionCheck = await pool.query('SELECT * FROM Institutions WHERE Institution_ID = $1', [institution_id]);
        if (institutionCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Institution not found' });
        }

        const result = await pool.query(
            `INSERT INTO Bus_Routes (
                Dropoff_Time, Pickup_Time, Pickup_Location, End_Location, 
                Start_Location, Bus_Fees, Stops, Route_Name, Institution_ID
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [dropoff_time, pickup_time, pickup_location, end_location,
                start_location, bus_fees, stops, route_name, institution_id]
        );
        res.status(201).json({ "Status": "OK", "Message": "Record Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Bus_Routes');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    pool.query("SELECT * FROM bus_routes where " + keyword + " = $1 order by route_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for Bus Routes`);
});
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Bus_Routes WHERE Route_ID = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Route not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const {
        dropoff_time, pickup_time, pickup_location,
        end_location, start_location, bus_fees,
        stops, route_name
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE Bus_Routes SET 
                Dropoff_Time = $1, Pickup_Time = $2, Pickup_Location = $3, 
                End_Location = $4, Start_Location = $5, Bus_Fees = $6, 
                Stops = $7, Route_Name = $8 
             WHERE Route_ID = $9 RETURNING *`,
            [dropoff_time, pickup_time, pickup_location, end_location,
                start_location, bus_fees, stops, route_name, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Route not found' });
        }
        res.json({ "Status": "OK", "Message": "Record is Updated Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Bus_Routes WHERE Route_ID = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Route not found' });
        }
        res.json({ message: 'Route deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/institution/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Bus_Routes WHERE Institution_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;