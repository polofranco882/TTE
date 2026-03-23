const { Client } = require('pg');
const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL || 'postgresql://doadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Connecting to DB...');
        await client.connect();
        
        console.log('Setting search_path to app...');
        await client.query('SET search_path TO app;');
        
        console.log('Reading landing_schema.sql...');
        const sql = fs.readFileSync('landing_schema.sql', 'utf8');
        
        console.log('Applying landing schema...');
        await client.query(sql);
        
        console.log('Success! Landing tables created in app schema.');
        process.exit(0);
    } catch (err) {
        console.error('Failed:', err.message);
        process.exit(1);
    }
}

run();
