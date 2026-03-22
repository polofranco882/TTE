const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    // Test the exact queries our API runs
    const pageRes = await pool.query("SELECT id FROM landing_pages WHERE slug = 'home'");
    if (pageRes.rows.length === 0) { console.error('No home page!'); return pool.end(); }
    const pageId = pageRes.rows[0].id;
    console.log('pageId:', pageId);

    // Simulate GET /gallery
    try {
        const r = await pool.query('SELECT * FROM landing_gallery_images WHERE landing_page_id=$1 ORDER BY display_order,id', [pageId]);
        console.log('gallery OK, rows:', r.rows.length);
    } catch (e) {
        console.error('gallery ERROR:', e.message);
    }

    // Simulate GET /banners  
    try {
        const r = await pool.query(
            `SELECT b.*, 
                (SELECT json_object_agg(language_code, json_build_object('title',title,'subtitle',subtitle,'description',description,'cta_text',cta_text))
                 FROM landing_banner_translations WHERE banner_id = b.id) as translations
             FROM landing_banners b WHERE b.landing_page_id = $1 ORDER BY display_order, id`, [pageId]);
        console.log('banners OK, rows:', r.rows.length);
    } catch (e) {
        console.error('banners ERROR:', e.message);
    }

    // Simulate GET /videos
    try {
        const r = await pool.query(
            `SELECT v.*, 
                (SELECT json_object_agg(language_code, json_build_object('title',title,'description',description))
                 FROM landing_video_translations WHERE video_id = v.id) as translations
             FROM landing_videos v WHERE landing_page_id=$1 ORDER BY display_order,id`, [pageId]);
        console.log('videos OK, rows:', r.rows.length);
    } catch (e) {
        console.error('videos ERROR:', e.message);
    }

    // Simulate GET /testimonials
    try {
        const r = await pool.query(
            `SELECT t.*, 
                (SELECT json_object_agg(language_code, json_build_object('quote',quote,'author_role',author_role))
                 FROM landing_testimonial_translations WHERE testimonial_id = t.id) as translations
             FROM landing_testimonials t WHERE landing_page_id=$1 ORDER BY display_order,id`, [pageId]);
        console.log('testimonials OK, rows:', r.rows.length);
    } catch (e) {
        console.error('testimonials ERROR:', e.message);
    }

    // Also test the public endpoint query
    try {
        const r = await pool.query('SELECT * FROM landing_gallery_images WHERE landing_page_id = $1 AND is_active = TRUE ORDER BY display_order ASC, id ASC', [pageId]);
        console.log('gallery public query OK, rows:', r.rows.length);
    } catch(e) {
        console.error('gallery public ERROR:', e.message);
    }

    pool.end();
}
run().catch(e => { console.error('FATAL:', e.message); pool.end(); });
