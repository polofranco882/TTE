const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function exportLangs() {
    const client = await pool.connect();
    try {
        const i18nRes = await client.query('SELECT key, en FROM i18n_labels');
        console.log('--- DICT_START ---');
        i18nRes.rows.forEach(r => console.log(`${r.key}|||${r.en}`));
        console.log('--- DICT_END ---');

        const landingRes = await client.query("SELECT id, sections_config FROM landing_pages WHERE slug = 'home'");
        if (landingRes.rows.length > 0) {
            console.log('--- LANDING_CMS_START ---');
            console.log(JSON.stringify(landingRes.rows[0], null, 2));
            console.log('--- LANDING_CMS_END ---');
        }

        const bannersRes = await client.query('SELECT id, title, subtitle, description, cta_text FROM landing_banners');
        console.log('--- BANNERS_START ---');
        console.log(JSON.stringify(bannersRes.rows, null, 2));
        console.log('--- BANNERS_END ---');

        const videosRes = await client.query('SELECT id, title, description FROM landing_videos');
        console.log('--- VIDEOS_START ---');
        console.log(JSON.stringify(videosRes.rows, null, 2));
        console.log('--- VIDEOS_END ---');

        const testimonialsRes = await client.query('SELECT id, author_role, quote FROM landing_testimonials');
        console.log('--- TESTIMONIALS_START ---');
        console.log(JSON.stringify(testimonialsRes.rows, null, 2));
        console.log('--- TESTIMONIALS_END ---');

    } catch (err) {
        console.error('Export failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

exportLangs();
