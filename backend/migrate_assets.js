
const { Client } = require('pg');

const config = {
    host: 'localhost',
    user: 'postgres',
    password: 'sa',
    port: 5432,
};

async function migrateAssets() {
    const client = new Client(config);
    try {
        await client.connect();

        // Update cover_image path for Book 1
        const res = await client.query(`
            UPDATE books 
            SET cover_image = '/assets/cover-book1.png'
            WHERE title = 'Trails to English 1'
        `);

        console.log(`Updated ${res.rowCount} books with new asset path.`);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

migrateAssets();
