require('dotenv').config();
const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
    });
    
    try {
        await client.connect();
        await client.query('SET search_path TO app, public;');
        console.log('Fixing sequence users_id_seq...');
        
        const res = await client.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));");
        console.log('Sequence updated to:', res.rows[0]);
        console.log('Done.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

run();
