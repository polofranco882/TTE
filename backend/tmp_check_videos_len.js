const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
    const res = await client.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'landing_videos'");
    res.rows.forEach(r => {
        console.log(`${r.column_name}: Type=${r.data_type}, MaxLen=${r.character_maximum_length}`);
    });
    client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
