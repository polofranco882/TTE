const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

const largeString = 'A'.repeat(10 * 1024 * 1024); // 10MB string

client.connect().then(async () => {
    try {
        console.log('Attempting to insert 10MB string into video_url...');
        const r = await client.query(
            `INSERT INTO landing_videos (landing_page_id, title, description, video_url, thumbnail_url, display_order)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [1, 'Large Test', 'Desc', largeString, 'thumb', 0]
        );
        console.log('Success! ID:', r.rows[0].id);
        
        // Clean up
        await client.query("DELETE FROM landing_videos WHERE id = $1", [r.rows[0].id]);
        console.log('Cleaned up.');
    } catch (e) {
        console.error('Error:', e.message);
    }
    client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
