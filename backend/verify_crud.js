const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const pageId = 1;
    // Simulate the exact admin query for gallery
    try {
        const r = await pool.query(
            'SELECT * FROM landing_gallery_images WHERE landing_page_id=$1 ORDER BY display_order,id',
            [pageId]
        );
        console.log('GALLERY ADMIN: OK, rows:', r.rows.length);
    } catch (e) {
        console.error('GALLERY ADMIN ERROR:', e.message);
    }

    // Simulate POST gallery
    try {
        const r = await pool.query(
            'INSERT INTO landing_gallery_images (landing_page_id, image_url, caption, alt_text, album, display_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [pageId, '/api/media/test', 'Test caption', 'Test alt', 'General', 0]
        );
        console.log('GALLERY INSERT: OK, id:', r.rows[0].id);
        // Clean up test row
        await pool.query('DELETE FROM landing_gallery_images WHERE id=$1', [r.rows[0].id]);
        console.log('GALLERY DELETE: OK (cleaned up)');
    } catch(e) {
        console.error('GALLERY INSERT ERROR:', e.message);
    }

    // Simulate admin banners query
    try {
        const r = await pool.query(
            `SELECT b.*, (SELECT json_object_agg(language_code, json_build_object('title',title,'subtitle',subtitle,'description',description,'cta_text',cta_text)) FROM landing_banner_translations WHERE banner_id = b.id) as translations FROM landing_banners b WHERE b.landing_page_id = $1 ORDER BY display_order, id`,
            [pageId]
        );
        console.log('BANNERS ADMIN: OK, rows:', r.rows.length);
    } catch(e) {
        console.error('BANNERS ADMIN ERROR:', e.message);
    }

    pool.end();
}
run().catch(e => { console.error('FATAL:', e.message); pool.end(); });
