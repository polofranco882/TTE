
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
    .then(() => console.log('DB Connected'))
    .catch(err => console.error('DB Connection Error:', err));

export default client;
