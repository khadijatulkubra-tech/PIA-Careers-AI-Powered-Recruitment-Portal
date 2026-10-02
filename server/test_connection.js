const pool = require('./db');

async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('PostgreSQL connected');
        console.log('Server time:', result.rows[0].now);
        process.exit(0);
    } catch (err) {
        console.error('Connection FAIL:', err.message);
        process.exit(1);
    }
}

testConnection();