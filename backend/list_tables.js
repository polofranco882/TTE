
const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'sa',
    port: 5432,
    database: 'TTE'
});

async function listTables() {
    try {
        await client.connect();
        console.log('Connected!');
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables:', res.rows.map(r => r.table_name));
        await client.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

listTables();
