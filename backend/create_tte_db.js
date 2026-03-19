
const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'sa',
    port: 5432,
    database: 'postgres' // Connect to default DB to create new one
});

async function createDB() {
    try {
        await client.connect();
        console.log('Connected to postgres DB');

        // Check if DB exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'TTE'");
        if (res.rowCount === 0) {
            console.log('Creating database TTE...');
            await client.query('CREATE DATABASE "TTE"');
            console.log('Database TTE created.');
        } else {
            console.log('Database TTE already exists.');
        }

    } catch (err) {
        console.error('Error creating DB:', err);
    } finally {
        await client.end();
    }
}

createDB();
