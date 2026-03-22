const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'landing_testimonials'");
    console.log(res.rows.map(r => r.column_name).join(', '));
    client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
