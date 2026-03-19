
const { Client } = require('pg');

const config = {
    host: 'localhost',
    user: 'postgres',
    password: 'sa',
    port: 5432,
};

async function migrateLibrary() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Connected to DB');

        // 1. Add cover_image column if not exists
        await client.query(`
            ALTER TABLE books 
            ADD COLUMN IF NOT EXISTS cover_image VARCHAR(255)
        `);
        console.log('Added cover_image column.');

        // 2. Update Book 1 -> Trails to English 1
        // We assume Book 1 has ID 1 or we find it by title 'Book 1'
        const res = await client.query(`
            UPDATE books 
            SET title = 'Trails to English 1', 
                cover_image = '/cover-book1.png',
                category = 'English Course',
                status = 'active'
            WHERE title = 'Book 1' OR title = 'Trails to English 1'
        `);

        console.log(`Updated ${res.rowCount} books (Book 1 -> Trails to English 1).`);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

migrateLibrary();
