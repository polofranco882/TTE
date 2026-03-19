
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function runMigrations() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const seedPath = path.join(__dirname, 'seed.sql');

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        console.log('Running Schema...');
        await client.query(schemaSql);
        console.log('Schema created.');

        console.log('Running Seed...');
        await client.query(seedSql);
        console.log('Seed data inserted.');

        await client.end();
        console.log('Done.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigrations();
