const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function exportLangs() {
    const client = await pool.connect();
    try {
        const i18nRes = await client.query('SELECT key, module, en, es, pt, zh, ja, fr, it, ht FROM i18n_labels');
        console.log('--- DICTIONARY ---');
        console.log(JSON.stringify(i18nRes.rows, null, 2));

        const landingRes = await client.query("SELECT id, slug, title, landing_cms_config FROM landing_pages WHERE slug = 'home'");
        console.log('--- LANDING_CMS ---');
        console.log(JSON.stringify(landingRes.rows, null, 2));

        const bannersRes = await client.query('SELECT * FROM landing_banners');
        console.log('--- BANNERS ---');
        console.log(JSON.stringify(bannersRes.rows, null, 2));

        const videosRes = await client.query('SELECT * FROM landing_videos');
        console.log('--- VIDEOS ---');
        console.log(JSON.stringify(videosRes.rows, null, 2));

        const testimonialsRes = await client.query('SELECT * FROM landing_testimonials');
        console.log('--- TESTIMONIALS ---');
        console.log(JSON.stringify(testimonialsRes.rows, null, 2));

    } catch (err) {
        console.error('Export failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

exportLangs();
