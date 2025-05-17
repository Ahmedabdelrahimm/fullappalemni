const express = require('express');
const { Pool } = require('pg');
// const bcrypt = require('bcrypt'); // Uncomment in production
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

// PostgreSQL Pool Setup
const pool = require('../db');
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database (User Routes)');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle user client', err);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Test DB connection
router.get('/test-connection', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ status: 'success', time: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ error: 'Database connection failed', message: err.message });
    }
});

// Register new user (Plain text password for dev)
router.post('/register', async (req, res) => {
    const { email, first_name, last_name, password, national_id, address, gender, birth_date } = req.body;

    try {
        const emailExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Calculate age from birth date
        const birthDate = new Date(birth_date);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        // 🚨 Plain text password for development only!
        // const hashedPassword = await bcrypt.hash(password, 10);
        const plainPassword = password;

        const result = await pool.query(
            `INSERT INTO users (email, first_name, last_name, password, national_id, address, gender, age, birth_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING user_id, email, first_name, last_name`,
            [email, first_name, last_name, plainPassword, national_id, address, gender, age, birth_date]
        );

        res.status(201).json({
            status: 'OK',
            message: 'User registered successfully',
            user: result.rows[0],
        });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
});

// Login user (Plain text comparison for dev)
router.post('/login', async (req, res) => {
    console.log('Login request received:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: 'Missing credentials',
            message: 'Email and password are required'
        });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // 🚨 Plain text comparison for development only!
        // const passwordMatch = await bcrypt.compare(password, user.password);
        const passwordMatch = password === user.password;

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Get user settings
        const settingsResult = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [user.user_id]);
        const settings = settingsResult.rows[0] || {};

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            {
                expiresIn: '1d',
            }
        );

        console.log('Login successful for user:', email);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                profile_picture: user.profile_picture,
                bio: user.bio,
                settings: settings
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: err.message
        });
    }
});

// Get all users (for admin or test purposes)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, email, first_name, last_name, gender, age FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
});

// // Get user by ID
// router.get('/:id', async (req, res) => {
//     const userId = parseInt(req.params.id);
//     if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

//     try {
//         const result = await pool.query('SELECT user_id, email, first_name, last_name, gender, age FROM users WHERE user_id = $1', [userId]);

//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         res.json(result.rows[0]);
//     } catch (err) {
//         console.error('Error fetching user:', err);
//         res.status(500).json({ error: 'Internal server error', message: err.message });
//     }
// });

// Update user profile
router.put('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const { first_name, last_name, email, bio, profile_picture, address, national_id, gender, birth_date } = req.body;

    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE users 
             SET first_name = $1, 
                 last_name = $2, 
                 email = $3, 
                 bio = $4, 
                 profile_picture = $5,
                 address = $6,
                 national_id = $7,
                 gender = $8,
                 birth_date = $9
             WHERE user_id = $10
             RETURNING *`,
            [first_name, last_name, email, bio, profile_picture, address, national_id, gender, birth_date, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: err.message
        });
    } finally {
        client.release();
    }
});

// Get top 5 contributors (protected route)
router.get('/top-contributors', authenticateToken, async (req, res) => {
    console.log('Fetching top contributors...');
    try {
        console.log('Executing database query...');
        const query = `
            WITH user_scores AS (
                SELECT u.user_id,
                       u.first_name,
                       u.profile_picture,
                       COALESCE(COUNT(r.review_id), 0) as review_count,
                       COALESCE(COUNT(bc.comment_id), 0) as comment_count,
                       COALESCE(COUNT(cm.message_id), 0) as message_count,
                       COALESCE(COUNT(DISTINCT cmem.room_id), 0) as room_count,
                       COALESCE(COUNT(ea.application_id), 0) + COALESCE(COUNT(sa.application_id), 0) as application_count
                FROM users u
                LEFT JOIN reviews r ON u.user_id = r.user_id
                LEFT JOIN blog_comments bc ON u.user_id = bc.user_id
                LEFT JOIN community_messages cm ON u.user_id = cm.user_id
                LEFT JOIN community_memberships cmem ON u.user_id = cmem.user_id
                LEFT JOIN enrollment_applications ea ON u.user_id = ea.user_id
                LEFT JOIN scholarship_applications sa ON u.user_id = sa.user_id
                GROUP BY u.user_id, u.first_name, u.profile_picture
            ),
            scored_users AS (
                SELECT user_scores.user_id,
                       user_scores.first_name,
                       user_scores.profile_picture,
                       (
                           user_scores.review_count * 2 +
                           user_scores.comment_count * 1.5 +
                           user_scores.message_count +
                           user_scores.room_count * 1.5 +
                           user_scores.application_count
                       ) as total_score
                FROM user_scores
            )
            SELECT user_id::text, 
                   first_name,
                   profile_picture,
                   total_score
            FROM scored_users
            WHERE total_score > 0
            ORDER BY total_score DESC
            LIMIT 5
        `;
        const result = await pool.query(query);

        console.log('Query executed successfully. Row count:', result.rows.length);
        console.log('Raw results:', result.rows);

        // Transform the results to include the profile_picture field as is
        const contributors = result.rows.map(user => ({
            ...user,
            profile_picture: user.profile_picture // Keep the profile_picture as is, without transforming to a full URL
        }));

        console.log('Final contributors data:', contributors);
        res.json(contributors);
    } catch (err) {
        console.error('Detailed error in top contributors:', {
            error: err,
            message: err.message,
            stack: err.stack,
            sqlState: err.code,
            detail: err.detail,
            hint: err.hint,
            position: err.position
        });
        res.status(500).json({
            error: 'Internal server error',
            message: err.message,
            detail: err.detail || 'No additional details available',
            query: query
        });
    }
});

// Get user language settings
router.get('/settings/language', authenticateToken, async (req, res) => {
    const userId = req.user.user_id;
    try {
        const result = await pool.query(
            'SELECT language FROM user_settings WHERE user_id = $1',
            [userId]
        );
        res.json({ language: result.rows[0]?.language || 'English' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
});

// Update user language settings
router.put('/settings/language', authenticateToken, async (req, res) => {
    const userId = req.user.user_id;
    const { language } = req.body;

    if (!language) {
        return res.status(400).json({ error: 'Language is required' });
    }

    try {
        // First try to update
        const updateResult = await pool.query(
            `UPDATE user_settings 
             SET language = $1 
             WHERE user_id = $2 
             RETURNING *`,
            [language, userId]
        );

        // If no row was updated, insert new settings
        if (updateResult.rows.length === 0) {
            const insertResult = await pool.query(
                `INSERT INTO user_settings (user_id, language) 
                 VALUES ($1, $2) 
                 RETURNING *`,
                [userId, language]
            );
            return res.json(insertResult.rows[0]);
        }

        res.json(updateResult.rows[0]);
    } catch (err) {
        console.error('Error updating language:', err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
});

module.exports = router;
