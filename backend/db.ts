import 'dotenv/config';
import { Client } from 'pg';

// Environment variables are now loaded via 'dotenv/config'

const isLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

if (!isLocal) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:sa@localhost:5432/TTE',
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

client.connect()
    .then(async () => {
        console.log('DB Connected');
        try {
            // Ensure both "app" and "public" schemas are searched.
            // This allows local (no app schema) and production (app schema) to work with the same code.
            await client.query('SET search_path TO app, public;');
            console.log('Search path set to app, public');
        } catch (e) {
            console.error('Error setting search_path:', e);
        }
    })
    .catch(err => console.error('DB Connection Error:', err));

export default client;
