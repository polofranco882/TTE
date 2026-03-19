
import { Client } from 'pg';

// dotenv removed to prevent interference
// dotenv.config();

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
        if (!isLocal) {
            try {
                // Ensure the "app" schema is used for all queries in production
                await client.query('SET search_path TO app, public;');
                console.log('Search path set to app, public');
            } catch (e) {
                console.error('Error setting search_path:', e);
            }
        }
    })
    .catch(err => console.error('DB Connection Error:', err));

export default client;
