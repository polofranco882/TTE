
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Hardcoded config that WORKED in db_test.js
const client = new Client({
    host: 'localhost',
    user: 'postgresql',
    password: 'sa',
    port: 5432,
});

async function runCallback() {
    console.log('Connecting...');
    try {
        await client.connect();
        console.log('Connected!');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const seedPath = path.join(__dirname, 'seed.sql');

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        console.log('Running Schema...');
        await client.query(schemaSql);
        console.log('Schema Success');

        console.log('Running Seed...');
        await client.query(seedSql);
        console.log('Seed Success');

        await client.end();
    } catch (e) {
        console.error('FAIL:', e);
    }
}

runCallback();
