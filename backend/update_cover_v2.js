
const { Client } = require('pg');

const config = {
    host: 'localhost',
    user: 'postgres',
    password: 'sa',
    port: 5432,
};

async function updateCover() {
    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query(`
            UPDATE books 
            SET cover_image = '/assets/cover-book1-v2.png' 
            WHERE title = 'Trails to English 1'
        `);
        console.log(`Updated ${res.rowCount} book(s) to use new cover.`);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

updateCover();
