const { Client } = require('pg');
const bcrypt = require('bcrypt');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function reset() {
    const connectionString = process.argv[2];
    const email = process.argv[3];
    const newPassword = process.argv[4];

    if (!connectionString || !email || !newPassword) {
        console.error('Usage: node reset_password.js <connection_string> <email> <new_password>');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // Hash the new password
        console.log('Hashing password...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the user in the "app" schema
        const query = 'UPDATE app.users SET password_hash = $1 WHERE email = $2';
        const result = await client.query(query, [hashedPassword, email]);

        if (result.rowCount > 0) {
            console.log(`SUCCESS: Password for ${email} has been reset!`);
        } else {
            console.log(`ERROR: User with email ${email} not found.`);
        }

    } catch (err) {
        console.error('RESET ERROR:', err.message);
    } finally {
        await client.end();
    }
}

reset();
