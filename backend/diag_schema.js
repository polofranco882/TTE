const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    // Check the gallery table columns
    const cols = await pool.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='landing_gallery_images' ORDER BY ordinal_position"
    );
    console.log('=== landing_gallery_images columns ===');
    cols.rows.forEach(c => console.log(c.column_name, '-', c.data_type));

    // Try SELECT * to see if it works
    try {
        const rows = await pool.query('SELECT * FROM landing_gallery_images LIMIT 2');
        console.log('\nSELECT OK, cols:', rows.fields.map(f => f.name).join(', '));
    } catch(e) {
        console.error('\nSELECT failed:', e.message);
    }

    // Also check related tables
    for (const t of ['landing_banners', 'landing_videos', 'landing_testimonials']) {
        const r = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
            [t]
        );
        console.log(`\n${t}:`, r.rows.map(c => c.column_name).join(', '));
    }

    pool.end();
}
run().catch(e => { console.error('FATAL:', e.message); pool.end(); });
