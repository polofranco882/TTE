const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function listTables() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
        
        for (const table of res.rows.map(r => r.table_name)) {
            const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}'`);
            console.log(`Table ${table} columns:`, cols.rows.map(r => r.column_name).join(', '));
        }
    } catch (err) {
        console.error('List failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

listTables();
