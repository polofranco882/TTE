const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    // Get column info for all landing module tables
    const tables = ['landing_gallery_images', 'landing_banners', 'landing_videos', 'landing_testimonials', 'landing_banner_translations', 'landing_video_translations', 'landing_testimonial_translations'];
    for (const t of tables) {
        const r = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [t]);
        if (r.rows.length > 0) {
            console.log(`\n── ${t} ──`);
            r.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
        } else {
            console.log(`\n── ${t}: NOT FOUND ──`);
        }
    }
    pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
