
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const configs = [
    { host: 'localhost', user: 'postgresql', password: 'sa', port: 5432 }
];

async function runMigrations() {
    for (const config of configs) {
        console.log(`Testing connection with user: ${config.user}...`);
        const client = new Client(config);
        try {
            await client.connect();
            console.log(`Connected successfully with user: ${config.user}!`);

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
            return;
        } catch (err) {
            console.error(`Failed with user ${config.user}:`, err.message);
        }
    }
}

runMigrations();
