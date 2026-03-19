const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function apply() {
    const connectionString = process.argv[2];
    if (!connectionString) {
        console.error('Usage: node apply_full_schema.js <connection_string>');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const schemaSql = fs.readFileSync(path.join(__dirname, 'full_schema.sql'), 'utf8');
        
        console.log('Applying full schema to "app" schema...');
        await client.query(schemaSql);
        console.log('SUCCESS: Full schema applied successfully!');

    } catch (err) {
        console.error('SCHEMA APPLICATION ERROR:', err.message);
    } finally {
        await client.end();
    }
}

apply();
