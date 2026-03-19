const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function patch() {
    const connectionString = process.argv[2];
    if (!connectionString) {
        console.error('Usage: node patch_schema.js <connection_string>');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        await client.query(`ALTER TABLE app.books ALTER COLUMN cover_image TYPE TEXT`);
        await client.query(`ALTER TABLE app.books ADD COLUMN IF NOT EXISTS sort_order INTEGER`);
        await client.query(`ALTER TABLE app.book_contents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
        await client.query(`ALTER TABLE app.book_contents ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES app.book_contents(id) ON DELETE SET NULL`);
        await client.query(`ALTER TABLE app.books ADD COLUMN IF NOT EXISTS description TEXT`);
        await client.query(`ALTER TABLE app.books ADD COLUMN IF NOT EXISTS details TEXT`);

        console.log('SUCCESS: Missing columns added successfully!');

    } catch (err) {
        console.error('PATCH ERROR:', err.message);
    } finally {
        await client.end();
    }
}

patch();
