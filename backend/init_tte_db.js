
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'sa',
    port: 5432,
    database: 'TTE' // Connect to the new TTE database
});

async function runMigrations() {
    try {
        await client.connect();
        console.log('Connected to TTE DB');

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

        // Also run the KPI seed data if available
        const kpiSeedPath = path.join(__dirname, 'seed_kpi.js');
        if (fs.existsSync(kpiSeedPath)) {
            console.log('Running KPI Seed...');
            // We can't easily require it and pass the client, but we can read it and execute if it exports a function,
            // or we can just run it as a separate process.
            // Let's just run it as a separate process after this script.
            console.log('KPI Seed will be run separately.');
        }

        await client.end();
        console.log('Done.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigrations();
