const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
    try {
        const lastVal = await client.query("SELECT last_value, is_called FROM landing_videos_id_seq");
        console.log('Sequence:', lastVal.rows[0]);
        const maxId = await client.query("SELECT MAX(id) FROM landing_videos");
        console.log('MAX(id):', maxId.rows[0].max);
        
        // Also check if home page exists
        const homePage = await client.query("SELECT id FROM landing_pages WHERE slug = 'home'");
        console.log('Home Page ID:', homePage.rows.length ? homePage.rows[0].id : 'Not found');
        
    } catch (e) {
        console.error('Error:', e.message);
    }
    client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
