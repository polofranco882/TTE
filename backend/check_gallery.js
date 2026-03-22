const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    // Check specifically what columns exist in landing_gallery_images
    const r = await pool.query(
        "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='landing_gallery_images' ORDER BY ordinal_position"
    );
    console.log('landing_gallery_images columns:');
    r.rows.forEach(c => console.log(' -', c.column_name, '|', c.data_type, '| nullable:', c.is_nullable));

    // Test the admin query exactly
    try {
        const pageId = 1;
        const r2 = await pool.query(
            'SELECT * FROM landing_gallery_images WHERE landing_page_id=$1 ORDER BY display_order,id', [pageId]
        );
        console.log('\nAdmin query OK');
    } catch(e) {
        console.error('\nAdmin query FAILED:', e.message);
    }

    // Check if landing_page_id has FK constraint that might fail
    try {
        const fk = await pool.query(`
            SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='landing_gallery_images'
        `);
        console.log('\nForeign keys:', JSON.stringify(fk.rows));
    } catch(e) {
        console.error('FK check error:', e.message);
    }

    pool.end();
}
run().catch(e => { console.error('FATAL:', e.message); pool.end(); });
