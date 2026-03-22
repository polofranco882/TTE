const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    // The existing landing_gallery_images may have a different schema.
    // Safely ADD any missing columns that our API depends on.
    const migrations = [
        // Ensure gallery has all needed columns
        `ALTER TABLE landing_gallery_images ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)`,
        `ALTER TABLE landing_gallery_images ADD COLUMN IF NOT EXISTS caption VARCHAR(300)`,
        `ALTER TABLE landing_gallery_images ADD COLUMN IF NOT EXISTS alt_text VARCHAR(200)`,
        `ALTER TABLE landing_gallery_images ADD COLUMN IF NOT EXISTS album VARCHAR(100) DEFAULT 'General'`,
        `ALTER TABLE landing_gallery_images ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0`,
        `ALTER TABLE landing_gallery_images ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`,
        `ALTER TABLE landing_gallery_images ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
        `ALTER TABLE landing_gallery_images ADD COLUMN IF NOT EXISTS landing_page_id INT`,

        // Ensure banners has all needed columns
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS landing_page_id INT`,
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS title VARCHAR(200)`,
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS subtitle VARCHAR(300)`,
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS cta_text VARCHAR(100)`,
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS cta_url VARCHAR(500)`,
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)`,
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS bg_color VARCHAR(50) DEFAULT '#09194F'`,
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0`,
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`,
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
        `ALTER TABLE landing_banners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,

        // Recreate constraint indexes safely
        `CREATE INDEX IF NOT EXISTS idx_gallery_landing_page ON landing_gallery_images(landing_page_id)`,
        `CREATE INDEX IF NOT EXISTS idx_banners_landing_page ON landing_banners(landing_page_id)`,
    ];

    for (const sql of migrations) {
        try {
            await pool.query(sql);
            console.log('OK:', sql.substring(0, 60));
        } catch (e) {
            console.error('SKIP:', e.message.substring(0, 80));
        }
    }

    // Final schema check
    const cols_gallery = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='landing_gallery_images' ORDER BY ordinal_position"
    );
    console.log('\nlanding_gallery_images:', cols_gallery.rows.map(c => c.column_name).join(', '));

    pool.end();
}
run().catch(e => { console.error('FATAL:', e.message); pool.end(); });
