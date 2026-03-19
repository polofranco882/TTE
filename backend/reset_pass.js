
const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Explicit config for TTE database
const config = {
    host: 'localhost',
    user: 'postgres',
    password: 'sa',
    port: 5432,
    database: 'TTE'
};

async function resetPasswords() {
    console.log('Connecting to TTE database...');
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Connected to DB successfully.');

        const password = 'password123';
        console.log(`Hashing password: ${password}`);
        const hash = await bcrypt.hash(password, 10);

        console.log('Updating users...');
        // Update all users to this password
        const res = await client.query('UPDATE users SET password_hash = $1', [hash]);
        console.log(`SUCCESS: Updated ${res.rowCount} users with new password.`);

        // Verify
        console.log('Verifying admin account...');
        const userRes = await client.query("SELECT * FROM users WHERE email = 'admin@tte.com'");
        if (userRes.rows.length > 0) {
            const user = userRes.rows[0];
            const match = await bcrypt.compare(password, user.password_hash);
            console.log(`Verification for admin@tte.com: ${match ? 'MATCH (Login should work)' : 'FAIL'}`);
        } else {
            console.log('WARNING: Admin user not found in TTE database!');
        }

    } catch (err) {
        console.error('ERROR during reset:', err);
    } finally {
        await client.end();
    }
}

resetPasswords();
