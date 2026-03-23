const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function exportForFilling() {
    const client = await pool.connect();
    try {
        // 1. Dictionary
        const i18nRes = await client.query('SELECT key, module, en, es, pt, zh, ja, fr, it, ht FROM i18n_labels ORDER BY module, key');
        console.log('--- DICTIONARY ---');
        console.log(JSON.stringify(i18nRes.rows, null, 2));

        // 2. Landing Sections (Base English for comparison)
        const sectRes = await client.query("SELECT section_key, field_key, field_value FROM landing_section_translations WHERE language_code = 'en'");
        console.log('--- LANDING_SECTIONS_EN ---');
        console.log(JSON.stringify(sectRes.rows, null, 2));

        // 3. Modules (Base content from main tables)
        const banners = await client.query('SELECT id, title, subtitle, description, cta_text FROM landing_banners');
        console.log('--- BANNERS_BASE ---');
        console.log(JSON.stringify(banners.rows, null, 2));

        const videos = await client.query('SELECT id, title, description FROM landing_videos');
        console.log('--- VIDEOS_BASE ---');
        console.log(JSON.stringify(videos.rows, null, 2));

        const testimonials = await client.query('SELECT author_name, author_role FROM landing_testimonials');
        const testimonialQuotes = await client.query("SELECT testimonial_id, quote, author_role FROM landing_testimonial_translations WHERE language_code = 'en'");
        console.log('--- TESTIMONIALS_BASE ---');
        console.log(JSON.stringify({ meta: testimonials.rows, quotes: testimonialQuotes.rows }, null, 2));

    } catch (err) {
        console.error('Export failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

exportForFilling();
