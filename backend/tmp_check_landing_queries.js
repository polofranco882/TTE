const { Client } = require('pg');
require('dotenv').config();
const pool = new Client({ connectionString: process.env.DATABASE_URL });

async function check() {
    await pool.connect();
    const lang = 'en';
    const pageId = 1;

    try {
        console.log('Checking Banners...');
        await pool.query(
            `SELECT b.*, COALESCE(bt.title, b.title::text) as title,
                    COALESCE(bt.subtitle, b.subtitle::text) as subtitle,
                    COALESCE(bt.description, b.description::text) as description,
                    COALESCE(bt.cta_text, b.cta_text::text) as cta_text
             FROM landing_banners b
             LEFT JOIN landing_banner_translations bt ON bt.banner_id = b.id AND bt.language_code = $2
             WHERE b.landing_page_id = $1 AND b.is_active = TRUE
             ORDER BY b.display_order ASC, b.id ASC`,
            [pageId, lang]
        );
        console.log('Banners OK');

        console.log('Checking Gallery...');
        await pool.query(
            `SELECT * FROM landing_gallery_images WHERE landing_page_id = $1 AND is_active = TRUE ORDER BY display_order ASC, id ASC`,
            [pageId]
        );
        console.log('Gallery OK');

        console.log('Checking Videos...');
        await pool.query(
            `SELECT v.*, COALESCE(vt.title, v.title::text) as title,
                    COALESCE(vt.description, v.description::text) as description
             FROM landing_videos v
             LEFT JOIN landing_video_translations vt ON vt.video_id = v.id AND vt.language_code = $2
             WHERE v.landing_page_id = $1 AND v.is_active = TRUE
             ORDER BY v.display_order ASC, v.id ASC`,
            [pageId, lang]
        );
        console.log('Videos OK');

        console.log('Checking Testimonials...');
        await pool.query(
            `SELECT t.*, COALESCE(tt.quote, t.quote::text) as quote,
                    COALESCE(tt.author_role, t.author_role::text) as author_role
             FROM landing_testimonials t
             LEFT JOIN landing_testimonial_translations tt ON tt.testimonial_id = t.id AND tt.language_code = $2
             WHERE t.landing_page_id = $1 AND t.is_active = TRUE
             ORDER BY t.display_order ASC, t.id ASC`,
            [pageId, lang]
        );
        console.log('Testimonials OK');

    } catch (err) {
        console.error('ERROR FOUND:', err.message);
        console.error('SQL STATE:', err.code);
    }
    await pool.end();
}

check();
