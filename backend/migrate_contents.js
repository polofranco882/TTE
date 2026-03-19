
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:sa@localhost:5432/TTE',
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS book_contents (
                id SERIAL PRIMARY KEY,
                book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                type VARCHAR(50) DEFAULT 'topic', -- 'chapter' or 'topic'
                content TEXT,
                page_number VARCHAR(10),
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await client.query(createTableQuery);
        console.log('Table book_contents created successfully');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
