const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL || 'postgresql://doadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Connecting to production as doadmin...');
        await client.connect();
        
        console.log('Ensuring app schema exists...');
        await client.query('CREATE SCHEMA IF NOT EXISTS app;');
        await client.query('SET search_path TO app;');
        
        console.log('Applying core schema (schema.sql)...');
        const coreSql = fs.readFileSync('schema.sql', 'utf8');
        await client.query(coreSql);
        
        console.log('Applying landing schema (landing_schema.sql)...');
        const landingSql = fs.readFileSync('landing_schema.sql', 'utf8');
        await client.query(landingSql);
        
        console.log('Database schema initialization completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Initialization failed:', err.message);
        process.exit(1);
    }
}

run();
