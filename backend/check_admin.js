const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL || 'postgresql://doadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require'; // Set in environment or .env

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log('Connecting as doadmin...');
        await client.connect();
        console.log('Successfully connected!');
        
        const schemas = await client.query('SELECT schema_name FROM information_schema.schemata');
        console.log('Schemas:', schemas.rows.map(s => s.schema_name).join(', '));
        
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'app'");
        console.log('Tables in app:', tables.rows.map(t => t.table_name).join(', '));
        
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err.message);
        process.exit(1);
    }
}

check();
