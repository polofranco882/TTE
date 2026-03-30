
const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function check() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    try {
        const res = await client.query('SELECT id, length(content::text) as len FROM book_contents WHERE id = 1637');
        console.log('Row 1637 content length:', res.rows[0]);
        
        const res2 = await client.query("SELECT id, length(content::text) as len FROM book_contents WHERE length(content::text) > 100000 ORDER BY len DESC LIMIT 10");
        console.log('Top 10 largest rows:', res2.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
check();
