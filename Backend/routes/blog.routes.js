const express = require('express');
const router = express.Router();
const pool = require('../db');

// Blog Posts
router.post('/posts', async (req, res) => {
    try {
        const { title, content, author, category, image_url, institution_id } = req.body;
        const newPost = await pool.query(
            'INSERT INTO Blog_Posts (title, content, author, category, image_url, institution_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, content, author, category, image_url, institution_id]
        );
        res.json(newPost.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/posts', async (req, res) => {
    try {
        const posts = await pool.query('SELECT * FROM Blog_Posts ORDER BY date_published DESC');
        res.json(posts.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const post = await pool.query('SELECT * FROM Blog_Posts WHERE post_id = $1', [id]);
        res.json(post.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/posts/institution/:institution_id', async (req, res) => {
    try {
        const { institution_id } = req.params;
        const posts = await pool.query(
            'SELECT * FROM Blog_Posts WHERE institution_id = $1 ORDER BY date_published DESC',
            [institution_id]
        );
        res.json(posts.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Blog Comments
router.post('/comments', async (req, res) => {
    try {
        const { post_id, user_id, content } = req.body;
        const newComment = await pool.query(
            'INSERT INTO Blog_Comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
            [post_id, user_id, content]
        );
        res.json(newComment.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/comments/:post_id', async (req, res) => {
    try {
        const { post_id } = req.params;
        const comments = await pool.query(
            'SELECT * FROM Blog_Comments WHERE post_id = $1 ORDER BY created_at DESC',
            [post_id]
        );
        res.json(comments.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 