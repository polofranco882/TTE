
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const pageId = 1; 
        const sections = ['gallery', 'videos', 'testimonials'];
        
        for (const key of sections) {
            console.log(`Checking/Inserting section: ${key}`);
            await client.query(`
                INSERT INTO landing_sections (landing_page_id, section_key, display_order, content_data)
                VALUES ($1, $2, 0, '{}')
                ON CONFLICT (landing_page_id, section_key) DO NOTHING
            `, [pageId, key]);
        }

        const translations = [
            { s: 'gallery', k: 'sectionSubtitle', v: 'Our Gallery' },
            { s: 'gallery', k: 'sectionTitle', v: 'Campus & Community' },
            { s: 'videos', k: 'sectionSubtitle', v: 'Videos' },
            { s: 'videos', k: 'sectionTitle', v: 'See TTESOL in Action' },
            { s: 'testimonials', k: 'sectionSubtitle', v: 'Student Voices' },
            { s: 'testimonials', k: 'sectionTitle', v: 'What Our Students Say' }
        ];

        for (const t of translations) {
            console.log(`Inserting translation: ${t.s} -> ${t.k}`);
            await client.query(`
                INSERT INTO landing_section_translations (landing_page_id, section_key, language_code, field_key, field_value, updated_at)
                VALUES ($1, $2, 'en', $3, $4, NOW())
                ON CONFLICT (landing_page_id, section_key, language_code, field_key)
                DO UPDATE SET field_value = EXCLUDED.field_value, updated_at = NOW()
            `, [pageId, t.s, t.k, t.v]);
        }

        await client.query('COMMIT');
        console.log("Migration complete!");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration failed!");
        console.error("Message:", e.message);
        console.error("Constraint:", e.constraint);
        console.error("Detail:", e.detail);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
