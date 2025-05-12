const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const crypto = require('crypto');

const router = express.Router();
const pool = require('../db');

// Helper function to validate card number (Luhn algorithm)
function validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned.charAt(i));

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

// Helper function to validate expiry date
function validateExpiryDate(expiryDate) {
    const [month, year] = expiryDate.split('/');
    if (!month || !year) return false;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expiryYear = parseInt(year);
    const expiryMonth = parseInt(month);

    if (expiryYear < currentYear) return false;
    if (expiryYear === currentYear && expiryMonth < currentMonth) return false;
    if (expiryMonth < 1 || expiryMonth > 12) return false;

    return true;
}

// Helper function to encrypt card number
function encryptCardNumber(cardNumber) {
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'your-secret-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(cardNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
}

router.post('/', async (req, res) => {
    const { payment_type, amount, user_id, institution_id } = req.body;

    try {

        const userCheck = await pool.query('SELECT * FROM Users WHERE User_ID = $1', [user_id]);
        if (userCheck.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }


        const institutionCheck = await pool.query('SELECT * FROM Institutions WHERE Institution_ID = $1', [institution_id]);
        if (institutionCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Institution not found' });
        }

        const result = await pool.query(
            `INSERT INTO Payment_Transactions (Payment_Type, Amount, User_ID, Institution_ID) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [payment_type, amount, user_id, institution_id]
        );
        res.status(201).json({ "Status": "OK", "Message": "Record Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Payment_Transactions');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/search', (req, res) => {
    keyword = req.query.keyword;
    keyvalue = req.query.keyvalue;
    sort = req.query.sort;
    pool.query("SELECT * FROM payment_transactions where " + keyword + " = $1 order by transaction_id " + sort, [keyvalue],
        function (err, result) {
            if (err) { res.json({ "Status": "Error", "Message": err }); }
            else {
                res.json(result.rows);
                console.log(result.rows);
            }
        });
    console.log(`Incoming SEARCH Request for Payments`);
});
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Payment_Transactions WHERE Transaction_ID = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/user/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Payment_Transactions WHERE User_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/institution/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Payment_Transactions WHERE Institution_ID = $1', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new payment method
router.post('/methods/:userId', async (req, res) => {
    const { userId } = req.params;
    const { card_number, card_holder, expiry_date, card_type, is_default, provider } = req.body;

    // Validate input
    if (!validateCardNumber(card_number)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid card number'
        });
    }

    if (!validateExpiryDate(expiry_date)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid or expired card'
        });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Encrypt card number
        const encrypted = encryptCardNumber(card_number);

        // If this is set as default, unset any existing default
        if (is_default) {
            await client.query(
                'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
                [userId]
            );
        }

        // Insert the new payment method
        const result = await client.query(
            `INSERT INTO payment_methods 
             (user_id, card_number, card_holder, expiry_date, card_type, is_default, provider, last_used, encrypted_data, iv)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, $9)
             RETURNING method_id, user_id, card_holder, expiry_date, card_type, is_default, last_used, provider`,
            [userId, card_number, card_holder, expiry_date, card_type, is_default, provider, encrypted.encryptedData, encrypted.iv]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            data: {
                ...result.rows[0],
                card_number: `•••• ${card_number.slice(-4)}`
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error adding payment method:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: err.message
        });
    } finally {
        client.release();
    }
});

// Get all payment methods for a user
router.get('/methods/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    console.log('Fetching payment methods for user:', userId);

    if (isNaN(userId)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid user ID',
            message: 'User ID must be a number'
        });
    }

    try {
        console.log('Executing database query...');
        const result = await pool.query(
            'SELECT method_id, user_id, card_number, card_holder, expiry_date, card_type, is_default, last_used, provider FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, last_used DESC',
            [userId]
        );

        console.log('Query result:', result.rows);

        // Add masked card_number to each method
        const methodsWithMaskedNumber = result.rows.map(method => ({
            ...method,
            card_number: method.card_number ? `•••• ${method.card_number.slice(-4)}` : '••••'
        }));

        res.json({
            success: true,
            data: methodsWithMaskedNumber
        });
    } catch (err) {
        console.error('Error fetching payment methods:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: err.message
        });
    }
});

// Delete a payment method
router.delete('/methods/:methodId', async (req, res) => {
    const { methodId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM payment_methods WHERE method_id = $1 RETURNING method_id',
            [methodId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Payment method not found'
            });
        }

        res.json({
            success: true,
            message: 'Payment method deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting payment method:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: err.message
        });
    }
});

// Set default payment method
router.patch('/methods/:methodId/default', async (req, res) => {
    const { methodId } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get user_id from the payment method
        const paymentMethod = await client.query(
            'SELECT user_id FROM payment_methods WHERE method_id = $1',
            [methodId]
        );

        if (paymentMethod.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Payment method not found'
            });
        }

        const userId = paymentMethod.rows[0].user_id;

        // Unset all default payment methods for the user
        await client.query(
            'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
            [userId]
        );

        // Set the specified payment method as default
        const result = await client.query(
            'UPDATE payment_methods SET is_default = true WHERE method_id = $1 RETURNING *',
            [methodId]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error setting default payment method:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: err.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;