const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function check() {
    const connectionString = process.argv[2];
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'books'");
        console.log(JSON.stringify(res.rows));
    } catch (err) {
        console.error(err.message);
    } finally {
        await client.end();
    }
}
check(process.argv[2]);
