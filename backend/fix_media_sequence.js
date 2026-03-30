const { Client } = require('pg');
require('dotenv').config({ path: './.env' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fixSequence() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        // Reset the sequence for media_assets based on the max ID
        const query = `
            SELECT setval(
                pg_get_serial_sequence('media_assets', 'id'), 
                COALESCE((SELECT MAX(id) FROM media_assets), 0) + 1, 
                false
            );
        `;
        
        await client.query(query);
        console.log('Successfully resynced media_assets ID sequence.');
    } catch (err) {
        console.error('Error fixing sequence:', err.message);
    } finally {
        await client.end();
    }
}

fixSequence();
