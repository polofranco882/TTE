require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
    console.log("Connecting to:", process.env.DATABASE_URL.split('@')[1]);
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
    });
    
    try {
        await client.connect();
        const hash = await bcrypt.hash('password123', 10);
        console.log('Generated hash for password123:', hash);
        
        let res1 = await client.query('UPDATE public.users SET password_hash = $1 WHERE email = $2 RETURNING *', [hash, 'admin@ttesol.com']).catch(e => ({rowCount: 0}));
        let res2 = await client.query('UPDATE app.users SET password_hash = $1 WHERE email = $2 RETURNING *', [hash, 'admin@ttesol.com']).catch(e => ({rowCount: 0}));
        
        console.log(`Updated public.users: ${res1.rowCount} rows`);
        console.log(`Updated app.users: ${res2.rowCount} rows`);
        
        if (res1.rowCount === 0 && res2.rowCount === 0) {
            console.log('Error: User admin@ttesol.com not found in ANY schema!');
        } else {
            console.log('Successfully enforced password123 on all schemas for admin@ttesol.com');
        }
    } catch (e) {
        console.error('Error updating password:', e);
    } finally {
        await client.end();
    }
}

run();
