const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
    const res = await client.query("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'landing_videos'");
    res.rows.forEach(r => {
        console.log(`${r.column_name}: Nullable=${r.is_nullable}, Default=${r.column_default}`);
    });
    client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
