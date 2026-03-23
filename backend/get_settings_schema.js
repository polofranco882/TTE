const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:sa@localhost:5432/TTE' });

async function run() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'settings'
            ORDER BY ordinal_position
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
