
const { Client } = require('pg');

const config = {
    host: 'localhost',
    user: 'postgres',
    password: 'sa',
    port: 5432,
};

async function checkBooks() {
    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query('SELECT id, title, cover_image FROM books ORDER BY id ASC');
        console.log('Current Books:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkBooks();
