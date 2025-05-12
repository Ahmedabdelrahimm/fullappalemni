const { Pool } = require('pg');
require('dotenv').config();

// Connection configuration
const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // Connection pool settings
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // how long to wait for a connection
};

// Create the pool
const pool = new Pool(config);

// Test the database connection
const testConnection = async () => {
    const client = await pool.connect();
    try {
        await client.query('SELECT NOW()');
        console.log('Successfully connected to PostgreSQL database');
    } catch (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    } finally {
        client.release();
    }
};

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit the process, just log the error
});

// Handle connection timeouts
pool.on('connect', (client) => {
    client.on('error', (err) => {
        console.error('Client error:', err);
    });
});

// Test the connection on startup
testConnection();

// Export the pool
module.exports = pool; 