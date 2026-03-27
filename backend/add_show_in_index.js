
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
}

async function run() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // Add column if it doesn't exist
        await client.query(`
            ALTER TABLE app.book_contents 
            ADD COLUMN IF NOT EXISTS show_in_index BOOLEAN DEFAULT TRUE;
        `);
        console.log('Column show_in_index added successfully (or already exists)');

    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await client.end();
    }
}

run();
