const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    console.log('Dropping and recreating landing_gallery_images with correct schema...');
    await pool.query('DROP TABLE IF EXISTS landing_gallery_images CASCADE');
    await pool.query(`
        CREATE TABLE landing_gallery_images (
            id            SERIAL PRIMARY KEY,
            landing_page_id INT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
            image_url     TEXT NOT NULL DEFAULT '',
            caption       VARCHAR(300),
            alt_text      VARCHAR(200),
            album         VARCHAR(100) DEFAULT 'General',
            display_order INT DEFAULT 0,
            is_active     BOOLEAN DEFAULT TRUE,
            created_at    TIMESTAMP DEFAULT NOW()
        )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_gallery_page ON landing_gallery_images(landing_page_id, is_active)');
    console.log('landing_gallery_images recreated OK');

    // Also ensure landing_banners has no broken FKs – recreate if needed
    const bannersCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='landing_banners' 
        ORDER BY ordinal_position
    `);
    console.log('landing_banners columns:', bannersCheck.rows.map(c => c.column_name).join(', '));

    // Quick verification   
    const pageId = 1;
    const test = await pool.query('SELECT * FROM landing_gallery_images WHERE landing_page_id=$1 LIMIT 1', [pageId]);
    console.log('Gallery SELECT OK, rows:', test.rows.length);

    pool.end();
}
run().catch(e => { console.error('FATAL:', e.message); pool.end(); });
