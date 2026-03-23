const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL || 'postgresql://doadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log('Connecting to defaultdb...');
        await client.connect();
        console.log('Successfully connected!');
        
        console.log('Setting search_path to app...');
        await client.query('SET search_path TO app;');
        
        console.log('Listing tables in app schema:');
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'app'");
        console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
        
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err.message);
        process.exit(1);
    }
}

check();
