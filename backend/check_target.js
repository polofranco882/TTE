
const { Client } = require('pg');

const config = {
    host: 'localhost',
    user: 'postgres',
    password: 'sa',
    port: 5432,
};

async function checkTarget() {
    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query("SELECT id, title, cover_image FROM books WHERE title = 'Trails to English 1'");
        console.log('Target Book:', res.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkTarget();
