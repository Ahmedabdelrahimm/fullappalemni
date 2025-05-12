const express = require('express');
const db = require('../db.js');
require('dotenv').config();

const router = express.Router();

// Helper function for handling database errors
const handleDatabaseError = (err, res) => {
    console.error('Database error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
};

router.post('/', async (req, res) => {
    const client = await db.connect();
    try {
        const {
            name,
            location,
            curriculum,
            contact_info,
            type,
            website,
            contact_email,
            contact_phone,
            image_urls,
            description,
            password
        } = req.body;

        // Check if contact email already exists
        const emailExists = await client.query(
            'SELECT * FROM institutions WHERE contact_email = $1',
            [contact_email]
        );

        if (emailExists.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Email already exists',
                message: 'An institution with this email already exists'
            });
        }

        // Start a transaction
        await client.query('BEGIN');

        // Insert institution
        const institutionResult = await client.query(
            `INSERT INTO institutions (
                name,
                type,
                description,
                location,
                curriculum,
                contact_info,
                website,
                contact_email,
                contact_phone,
                password,
                rating,
                total_reviews,
                reputation_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0, 0) RETURNING institution_id`,
            [
                name,
                type,
                description,
                location,
                curriculum,
                contact_info,
                website,
                contact_email,
                contact_phone,
                password
            ]
        );

        const institutionId = institutionResult.rows[0].institution_id;

        // Insert images if provided
        if (image_urls && image_urls.length > 0) {
            for (let i = 0; i < image_urls.length; i++) {
                await client.query(
                    'INSERT INTO institution_images (institution_id, image_url, is_primary) VALUES ($1, $2, $3)',
                    [institutionId, image_urls[i], i === 0] // First image is primary
                );
            }
        }

        // Commit the transaction
        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: "Institution registered successfully",
            institution: {
                ...institutionResult.rows[0],
                images: image_urls || []
            }
        });
    } catch (err) {
        // Rollback the transaction in case of error
        await client.query('ROLLBACK');
        console.error('Error registering institution:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: err.message
        });
    } finally {
        client.release();
    }
});

router.get('/', async (req, res) => {
    const client = await db.connect();
    try {
        const { search, type, limit = 10, offset = 0 } = req.query;
        let query = 'SELECT * FROM institutions WHERE 1=1';
        const values = [];

        if (search) {
            query += ' AND (name ILIKE $1 OR location ILIKE $1)';
            values.push(`%${search}%`);
        }

        if (type) {
            query += ` AND type = $${values.length + 1}`;
            values.push(type);
        }

        query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(limit, offset);

        const result = await client.query(query, values);
        res.json(result.rows);
    } catch (err) {
        handleDatabaseError(err, res);
    } finally {
        client.release();
    }
});

router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    db.query("SELECT * FROM institutions where " + keyword + " = $1 order by institution_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for Institutions`);
});
router.get('/:id/images', async (req, res) => {
    const client = await db.connect();
    try {
        const institutionId = req.params.id;
        console.log(`Backend: Fetching images for institution ID: ${institutionId}`);

        // Validate the ID is a number
        if (isNaN(institutionId)) {
            console.log(`Backend: Invalid institution ID: ${institutionId}`);
            return res.status(400).json({ error: 'Invalid institution ID' });
        }

        const query = `
            SELECT image_id, image_url, is_primary
            FROM institution_images
            WHERE institution_id = $1
            ORDER BY is_primary DESC;
        `;
        
        console.log(`Backend: Executing query: ${query.replace(/\s+/g, ' ')}`);
        console.log(`Backend: Query parameters: [${institutionId}]`);
        
        const result = await client.query(query, [institutionId]);
        console.log(`Backend: Query returned ${result.rows.length} rows`);
        
        if (result.rows.length === 0) {
            console.log(`Backend: No images found for institution ID: ${institutionId}`);
            // Return an empty array instead of 404 status
            return res.json({
                institution_id: institutionId,
                image_count: 0,
                images: []
            });
        }

        const response = {
            institution_id: institutionId,
            image_count: result.rows.length,
            images: result.rows
        };
        
        console.log(`Backend: Sending response with ${result.rows.length} images`);
        res.json(response);
        
    } catch (err) {
        console.error('Backend: Error fetching institution images:', err);
        // Add more detailed error logging
        console.error('Error details:', err.message);
        if (err.stack) console.error('Stack trace:', err.stack);
        
        res.status(500).json({ 
            error: 'Internal server error',
            message: err.message
        });
    } finally {
        client.release();
    }
});

router.get('/:id', async (req, res) => {
    const client = await db.connect();
    try {
        // First verify the ID is a valid number
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Invalid institution ID'
            });
        }

        // Get institution details
        const institutionResult = await client.query(
            'SELECT * FROM institutions WHERE institution_id = $1',
            [id]
        );

        if (institutionResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Institution not found'
            });
        }

        // Get programs for this institution
        const programsResult = await client.query(
            'SELECT * FROM educational_programs WHERE institution_id = $1',
            [id]
        );

        // Get facilities for this institution
        const facilitiesResult = await client.query(
            'SELECT * FROM institution_facilities WHERE institution_id = $1',
            [id]
        );

        // Get images for this institution
        const imagesResult = await client.query(
            'SELECT * FROM institution_images WHERE institution_id = $1',
            [id]
        );

        // Combine all the data
        const response = {
            ...institutionResult.rows[0],
            programs: programsResult.rows,
            facilities: facilitiesResult.rows,
            images: imagesResult.rows
        };

        res.json(response);
    } catch (err) {
        console.error('Error fetching institution details:', err);
        handleDatabaseError(err, res);
    } finally {
        client.release();
    }
});

router.put('/:id', async (req, res) => {
    const client = await db.connect();
    try {
        const { name, location, curriculum, reputation_score, contact_info } = req.body;
        const result = await client.query(
            `UPDATE institutions SET
                name = $1,
                type = $2,
                description = $3,
                location = $4,
                rating = $5,
                image_url = $6,
                website = $7,
                contact_email = $8,
                contact_phone = $9
             WHERE institution_id = $10 RETURNING *`,
            [name, location, curriculum, reputation_score, contact_info, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Institution not found'
            });
        }

        res.json({
            status: "OK",
            message: "Record Updated Successfully",
            data: result.rows[0]
        });
    } catch (err) {
        handleDatabaseError(err, res);
    } finally {
        client.release();
    }
});

router.delete('/:id', async (req, res) => {
    const client = await db.connect();
    try {
        const result = await client.query(
            'DELETE FROM institutions WHERE institution_id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Institution not found'
            });
        }

        res.json({
            status: "OK",
            message: 'Institution deleted successfully',
            data: result.rows[0]
        });
    } catch (err) {
        handleDatabaseError(err, res);
    } finally {
        client.release();
    }
});

// Toggle bookmark for an institution
router.post('/:id/bookmark', async (req, res) => {
    const client = await db.connect();
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        // Check if bookmark exists
        const checkQuery = 'SELECT * FROM bookmarks WHERE user_id = $1 AND institution_id = $2';
        const existing = await client.query(checkQuery, [user_id, id]);

        if (existing.rows.length > 0) {
            // Remove bookmark
            await client.query(
                'DELETE FROM bookmarks WHERE user_id = $1 AND institution_id = $2',
                [user_id, id]
            );
            res.json({ message: 'Bookmark removed' });
        } else {
            // Add bookmark
            await client.query(
                'INSERT INTO bookmarks (user_id, institution_id) VALUES ($1, $2)',
                [user_id, id]
            );
            res.json({ message: 'Bookmark added' });
        }
    } catch (err) {
        handleDatabaseError(err, res);
    } finally {
        client.release();
    }
});

// Get user's bookmarked institutions
router.get('/bookmarks/:userId', async (req, res) => {
    const client = await db.connect();
    try {
        const { userId } = req.params;
        const query = `
            SELECT i.* 
            FROM institutions i
            JOIN bookmarks b ON i.institution_id = b.institution_id
            WHERE b.user_id = $1
        `;

        const result = await client.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        handleDatabaseError(err, res);
    } finally {
        client.release();
    }
});

// Search institutions
router.get('/search/:keyword', async (req, res) => {
    try {
        const { keyword } = req.params;
        const result = await db.query(
            'SELECT * FROM institutions WHERE name ILIKE $1 OR description ILIKE $1',
            [`%${keyword}%`]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error searching institutions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;



