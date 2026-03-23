const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function listExactKeys() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT key, en FROM i18n_labels');
        console.log('--- EXACT_KEYS_START ---');
        res.rows.forEach(r => console.log(`${r.key}|||${r.en}`));
        console.log('--- EXACT_KEYS_END ---');
    } catch (err) {
        console.error('List failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

listExactKeys();
