const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:sa@localhost:5432/TTE' });

async function run() {
    try {
        await client.connect();
        const res = await client.query("SELECT email, password_hash FROM users WHERE email = 'admin@ttesol.com'");
        console.log(JSON.stringify(res.rows[0], null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
