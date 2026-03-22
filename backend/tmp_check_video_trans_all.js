const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
    const res = await client.query("SELECT table_schema, column_name, data_type FROM information_schema.columns WHERE table_name = 'landing_video_translations'");
    console.log(JSON.stringify(res.rows, null, 2));
    client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
