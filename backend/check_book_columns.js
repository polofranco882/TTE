
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:sa@localhost:5432/TTE'
});

async function checkColumns() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'books'
        `);
        console.log('Columns in books table:');
        res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
        await client.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkColumns();
