
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:sa@localhost:5432/TTE'
});

async function migrate() {
    try {
        await client.connect();
        console.log('Migrating books table...');

        await client.query(`
            ALTER TABLE books 
            ADD COLUMN IF NOT EXISTS rating VARCHAR(20),
            ADD COLUMN IF NOT EXISTS reading_time VARCHAR(50),
            ADD COLUMN IF NOT EXISTS publisher VARCHAR(200),
            ADD COLUMN IF NOT EXISTS isbn VARCHAR(50),
            ADD COLUMN IF NOT EXISTS publication_date VARCHAR(50)
        `);

        console.log('Migration successful: Added new metadata columns to books.');
        await client.end();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
