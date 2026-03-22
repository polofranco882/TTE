const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    await client.connect();
    console.log('Connected to DB. Starting migrations...');
    
    const queries = [
        // Videos
        "ALTER TABLE landing_videos ALTER COLUMN video_url TYPE TEXT",
        "ALTER TABLE landing_videos ALTER COLUMN thumbnail_url TYPE TEXT",
        "ALTER TABLE landing_videos ALTER COLUMN title TYPE TEXT",
        
        // Banners
        "ALTER TABLE landing_banners ALTER COLUMN image_url TYPE TEXT",
        
        // Gallery
        "ALTER TABLE landing_gallery_images ALTER COLUMN image_url TYPE TEXT",
        
        // Testimonials
        "ALTER TABLE landing_testimonials ALTER COLUMN author_avatar TYPE TEXT"
    ];
    
    for (const q of queries) {
        try {
            console.log(`Executing: ${q}`);
            await client.query(q);
        } catch (e) {
            console.error(`Error on ${q}:`, e.message);
        }
    }
    
    console.log('Migration completed.');
    await client.end();
}

migrate().catch(e => { console.error(e.message); process.exit(1); });
