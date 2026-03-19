
import { Client } from 'pg';

// dotenv removed to prevent interference
// dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:sa@localhost:5432/TTE',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

client.connect()
    .then(() => console.log('DB Connected'))
    .catch(err => console.error('DB Connection Error:', err));

export default client;
