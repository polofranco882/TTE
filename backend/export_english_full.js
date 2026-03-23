const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function exportAllEnglish() {
    const client = await pool.connect();
    try {
        const data = {
            dictionary: {},
            landingSections: {},
            banners: [],
            videos: [],
            testimonials: []
        };

        // 1. Dictionary
        const dictRes = await client.query('SELECT key, en FROM i18n_labels WHERE is_active = true');
        dictRes.rows.forEach(r => data.dictionary[r.key] = r.en);

        // 2. Landing Sections
        const sectRes = await client.query("SELECT section_key, field_key, field_value FROM landing_section_translations WHERE language_code = 'en'");
        sectRes.rows.forEach(r => {
            if (!data.landingSections[r.section_key]) data.landingSections[r.section_key] = {};
            data.landingSections[r.section_key][r.field_key] = r.field_value;
        });

        // 3. Banners
        const bannersRes = await client.query('SELECT id, title, subtitle, description, cta_text FROM landing_banners');
        data.banners = bannersRes.rows;

        // 4. Videos
        const videosRes = await client.query('SELECT id, title, description FROM landing_videos');
        data.videos = videosRes.rows;

        // 5. Testimonials
        const testimonialsRes = await client.query("SELECT testimonial_id, quote, author_role FROM landing_testimonial_translations WHERE language_code = 'en'");
        data.testimonials = testimonialsRes.rows;

        console.log(JSON.stringify(data, null, 2));

    } catch (err) {
        console.error('Export failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

exportAllEnglish();
