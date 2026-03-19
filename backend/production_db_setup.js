/**
 * Database Setup Script for Production (DigitalOcean)
 * This script runs schema.sql, seed.sql and ensures ai_config table is ready.
 * 
 * Usage: node backend/production_db_setup.js "YOUR_DIGITAL_OCEAN_CONNECTION_STRING"
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Force ignore SSL certificate errors for DigitalOcean self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.argv[2];

if (!connectionString) {
    console.error('Error: Please provide the DigitalOcean connection string as an argument.');
    console.log('Usage: node backend/production_db_setup.js "postgresql://user:pass@host:port/dbname?sslmode=require"');
    process.exit(1);
}

async function runSetup() {
    console.log('Connecting to DigitalOcean Database...');
    const client = new Client({
        connectionString: connectionString.includes('sslmode=') ? connectionString : `${connectionString}${connectionString.includes('?') ? '&' : '?'}sslmode=require`,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected successfully!');

        // Use a dedicated schema to avoid "permission denied for schema public" (PG 15+)
        console.log('Setting up dedicated "app" schema...');
        try {
            await client.query('CREATE SCHEMA IF NOT EXISTS app;');
            await client.query('SET search_path TO app;');
            console.log('Using "app" schema.');
        } catch (e) {
            console.error('Error creating schema:', e.message);
            console.log('Attempting to proceed anyway...');
        }

        const schemaPath = path.join(__dirname, 'schema.sql');
        const seedPath = path.join(__dirname, 'seed.sql');

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        // 1. Run Schema
        console.log('Running Schema (creating tables)...');
        await client.query(schemaSql);
        console.log('Schema created.');

        // 2. Run AI Config Migration (Missing from schema.sql)
        console.log('Ensuring ai_config table exists...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS ai_config (
                id              SERIAL PRIMARY KEY,
                provider        VARCHAR(20) NOT NULL DEFAULT 'openai',
                api_key         TEXT NOT NULL DEFAULT '',
                model           VARCHAR(100) DEFAULT 'gpt-image-1',
                allow_image     BOOLEAN DEFAULT TRUE,
                allow_video     BOOLEAN DEFAULT TRUE,
                max_seconds     INTEGER DEFAULT 15,
                max_resolution  VARCHAR(20) DEFAULT '1024x1024',
                max_size_mb     INTEGER DEFAULT 10,
                updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        const { rowCount } = await client.query('SELECT id FROM ai_config LIMIT 1');
        if (rowCount === 0) {
            await client.query(`INSERT INTO ai_config (provider) VALUES ('openai')`);
            console.log('Inserted default ai_config row.');
        }
        console.log('ai_config table ready.');

        // 3. Run Seed
        console.log('Running Seed (inserting initial data)...');
        await client.query(seedSql);
        console.log('Seed data inserted.');

        console.log('\nSUCCESS: Your DigitalOcean database is now ready for production!');
        await client.end();
    } catch (err) {
        console.error('\nERROR during setup:', err.message);
        process.exit(1);
    }
}

runSetup();
