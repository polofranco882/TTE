const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
    const res = await client.query("SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'landing_videos'");
    console.log(JSON.stringify(res.rows, null, 2));
    client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
