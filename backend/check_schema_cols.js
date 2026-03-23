const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        const tables = ['i18n_labels', 'landing_pages', 'landing_banners', 'landing_videos', 'landing_testimonials'];
        for (const table of tables) {
            const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(`Schema for ${table}:`, res.rows.map(r => r.column_name).join(', '));
        }
    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
