const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to DB...');
        
        const sqlPath = path.join(__dirname, 'landing_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Applying Landing Page schema...');
        await client.query(sql);
        console.log('Landing Page schema applied successfully.');
        
        // Ensure default landing page exists
        const res = await client.query("SELECT id FROM landing_pages WHERE slug = 'home'");
        let landingPageId;
        
        if (res.rows.length === 0) {
            console.log('Creating default landing page (slug: home)...');
            const insertRes = await client.query(
                "INSERT INTO landing_pages (slug, meta_title, meta_description) VALUES ($1, $2::jsonb, $3::jsonb) RETURNING id",
                ['home', JSON.stringify({ en: "TTESOL Academy", es: "Academia TTESOL" }), JSON.stringify({ en: "Learn English Online", es: "Aprende inglés online" })]
            );
            landingPageId = insertRes.rows[0].id;
        } else {
            console.log('Default landing page exists.');
            landingPageId = res.rows[0].id;
        }
        
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
