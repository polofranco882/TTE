const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function findCols() {
    const client = await pool.connect();
    try {
        const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'landing_pages'`);
        console.log('Columns for landing_pages:', res.rows.map(r => r.column_name).join(', '));
    } catch (err) {
        console.error('Find failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

findCols();
