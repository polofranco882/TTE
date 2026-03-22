import express from 'express';
import { Pool } from 'pg';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ─── Helper: get page id ────────────────────────────────────────────────────
async function getHomePageId(): Promise<number | null> {
    const r = await pool.query("SELECT id FROM landing_pages WHERE slug = 'home'");
    return r.rows.length ? r.rows[0].id : null;
}

// ─── GET /api/landing?lang=es  ───────────────────────────────────────────────
// Returns the assembled CMS config merged with translation overrides for `lang`.
// Fallback chain: requested language → English → raw content_data JSON blob.
router.get('/', async (req, res) => {
    try {
        const lang = (req.query.lang as string || 'en').split('-')[0].toLowerCase();

        const pageRes = await pool.query("SELECT id FROM landing_pages WHERE slug = 'home'");
        if (pageRes.rows.length === 0) {
            return res.json({ landing_cms_config: '{}' });
        }

        const pageId = pageRes.rows[0].id;

        // Fetch base sections (used as a structural scaffold + image/toggle fields)
        const sectionsRes = await pool.query(
            'SELECT section_key, content_data FROM landing_sections WHERE landing_page_id = $1',
            [pageId]
        );

        const config: any = {};
        for (const row of sectionsRes.rows) {
            config[row.section_key] = { ...(row.content_data || {}) };
        }

        // Fetch English translations (used as first-level override / fallback)
        const enTrans = await pool.query(
            'SELECT section_key, field_key, field_value FROM landing_section_translations WHERE landing_page_id = $1 AND language_code = $2',
            [pageId, 'en']
        );
        for (const row of enTrans.rows) {
            if (!config[row.section_key]) config[row.section_key] = {};
            config[row.section_key][row.field_key] = row.field_value;
        }

        // If a different lang was requested, merge on top (overriding English where available)
        if (lang !== 'en') {
            const langTrans = await pool.query(
                'SELECT section_key, field_key, field_value FROM landing_section_translations WHERE landing_page_id = $1 AND language_code = $2',
                [pageId, lang]
            );
            for (const row of langTrans.rows) {
                if (!config[row.section_key]) config[row.section_key] = {};
                if (row.field_value) {            // Only override if translation is not empty
                    config[row.section_key][row.field_key] = row.field_value;
                }
            }
        }

        res.json({ landing_cms_config: JSON.stringify(config) });
    } catch (error: any) {
        console.error('Error fetching landing config:', error.message);
        res.status(500).json({ error: 'Server error retrieving landing config' });
    }
});

// ─── GET /api/landing/translations ──────────────────────────────────────────
// Returns ALL translations grouped for the admin CMS:
// { [sectionKey]: { [lang]: { [field]: value } } }
router.get('/translations', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const pageId = await getHomePageId();
        if (!pageId) return res.json({});

        const result = await pool.query(
            'SELECT section_key, language_code, field_key, field_value FROM landing_section_translations WHERE landing_page_id = $1 ORDER BY section_key, language_code, field_key',
            [pageId]
        );

        const grouped: any = {};
        for (const row of result.rows) {
            if (!grouped[row.section_key]) grouped[row.section_key] = {};
            if (!grouped[row.section_key][row.language_code]) grouped[row.section_key][row.language_code] = {};
            grouped[row.section_key][row.language_code][row.field_key] = row.field_value;
        }

        res.json(grouped);
    } catch (error: any) {
        console.error('Error fetching translations:', error.message);
        res.status(500).json({ error: 'Server error fetching translations' });
    }
});

// ─── POST /api/landing/translations  ────────────────────────────────────────
// Upserts translation fields for a given section+language.
// Body: { sectionKey: string, languageCode: string, fields: {fieldKey: value} }
router.post('/translations', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { sectionKey, languageCode, fields } = req.body;
        if (!sectionKey || !languageCode || !fields || typeof fields !== 'object') {
            return res.status(400).json({ error: 'Invalid payload: sectionKey, languageCode, and fields are required.' });
        }

        const pageId = await getHomePageId();
        if (!pageId) return res.status(404).json({ error: 'Landing page not initialized' });

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const [fieldKey, fieldValue] of Object.entries(fields)) {
                await client.query(`
                    INSERT INTO landing_section_translations
                        (landing_page_id, section_key, language_code, field_key, field_value, updated_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                    ON CONFLICT (landing_page_id, section_key, language_code, field_key)
                    DO UPDATE SET field_value = EXCLUDED.field_value, updated_at = NOW()
                `, [pageId, sectionKey, languageCode, fieldKey, fieldValue ?? '']);
            }
            await client.query('COMMIT');
            res.json({ message: 'Translation saved successfully' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error saving translations:', error.message);
        res.status(500).json({ error: 'Server error saving translations' });
    }
});

// ─── POST /api/landing ── (Legacy: save structural config) ──────────────────
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const payloadString = req.body.settings?.landing_cms_config;
        if (!payloadString) return res.status(400).json({ error: 'Invalid payload' });

        const config = JSON.parse(payloadString);

        const pageRes = await pool.query("SELECT id FROM landing_pages WHERE slug = 'home'");
        if (pageRes.rows.length === 0) return res.status(404).json({ error: 'Landing page not initialized' });
        const pageId = pageRes.rows[0].id;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const [key, data] of Object.entries(config)) {
                await client.query(`
                    INSERT INTO landing_sections (landing_page_id, section_key, display_order, content_data, updated_at)
                    VALUES ($1, $2, 0, $3, NOW())
                    ON CONFLICT (landing_page_id, section_key)
                    DO UPDATE SET content_data = EXCLUDED.content_data, updated_at = NOW()
                `, [pageId, key, data]);
            }

            await client.query('COMMIT');
            res.json({ message: 'Landing configuration saved successfully' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Error saving landing config:', error.message);
        res.status(500).json({ error: 'Server error saving landing config' });
    }
});

export default router;
