import express from 'express';
import { Pool } from 'pg';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getHomePageId(): Promise<number | null> {
    const r = await pool.query("SELECT id FROM landing_pages WHERE slug = 'home'");
    return r.rows.length ? r.rows[0].id : null;
}

// ═══════════════════════════════════════════════════════════
// PUBLIC endpoints (no auth) – used by the landing page
// ═══════════════════════════════════════════════════════════

// GET /api/landing-modules?lang=es
// Returns all active items for banners, gallery, videos, testimonials
router.get('/', async (req, res) => {
    try {
        const lang = ((req.query.lang as string) || 'en').split('-')[0].toLowerCase();
        const pageId = await getHomePageId();
        if (!pageId) return res.json({ banners: [], gallery: [], videos: [], testimonials: [] });

        // Banners
        const bannersRes = await pool.query(
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
        // Gallery
        const galleryRes = await pool.query(
            `SELECT * FROM landing_gallery_images WHERE landing_page_id = $1 AND is_active = TRUE ORDER BY display_order ASC, id ASC`,
            [pageId]
        );
        // Videos
        const videosRes = await pool.query(
            `SELECT v.*, COALESCE(vt.title, v.title::text) as title,
                    COALESCE(vt.description, v.description::text) as description
             FROM landing_videos v
             LEFT JOIN landing_video_translations vt ON vt.video_id = v.id AND vt.language_code = $2
             WHERE v.landing_page_id = $1 AND v.is_active = TRUE
             ORDER BY v.display_order ASC, v.id ASC`,
            [pageId, lang]
        );
        // Testimonials
        const testimonialsRes = await pool.query(
            `SELECT t.*, COALESCE(tt.quote, t.quote::text) as quote,
                    COALESCE(tt.author_role, t.author_role::text) as author_role
             FROM landing_testimonials t
             LEFT JOIN landing_testimonial_translations tt ON tt.testimonial_id = t.id AND tt.language_code = $2
             WHERE t.landing_page_id = $1 AND t.is_active = TRUE
             ORDER BY t.display_order ASC, t.id ASC`,
            [pageId, lang]
        );

        res.json({
            banners:      bannersRes.rows,
            gallery:      galleryRes.rows,
            videos:       videosRes.rows,
            testimonials: testimonialsRes.rows,
        });
    } catch (err: any) {
        console.error('landing-modules GET error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════════
// ADMIN CRUD – Banners
// ═══════════════════════════════════════════════════════════

// GET /api/landing-modules/banners  (admin – all including inactive)
router.get('/banners', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const pageId = await getHomePageId();
        if (!pageId) return res.json([]);
        const result = await pool.query(
            `SELECT b.*, 
                    (SELECT json_object_agg(language_code, json_build_object('title',title,'subtitle',subtitle,'description',description,'cta_text',cta_text))
                     FROM landing_banner_translations WHERE banner_id = b.id) as translations
             FROM landing_banners b WHERE b.landing_page_id = $1 ORDER BY display_order, id`,
            [pageId]
        );
        res.json(result.rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/landing-modules/banners
router.post('/banners', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const pageId = await getHomePageId();
        if (!pageId) return res.status(404).json({ error: 'Landing page not found' });
        const { title, subtitle, description, cta_text, cta_url, image_url, bg_color, display_order } = req.body;
        const r = await pool.query(
            `INSERT INTO landing_banners (landing_page_id, title, subtitle, description, cta_text, cta_url, image_url, bg_color, display_order)
             VALUES ($1, $2::jsonb, $3::jsonb, $4, $5::jsonb, $6, $7, $8, $9) RETURNING *`,
            [pageId, JSON.stringify(title), JSON.stringify(subtitle), description, JSON.stringify(cta_text), cta_url, image_url, bg_color || '#09194F', display_order || 0]
        );
        res.json(r.rows[0]);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PUT /api/landing-modules/banners/:id
router.put('/banners/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { title, subtitle, description, cta_text, cta_url, image_url, bg_color, display_order, is_active } = req.body;
        const r = await pool.query(
            `UPDATE landing_banners SET title=$1::jsonb, subtitle=$2::jsonb, description=$3, cta_text=$4::jsonb, cta_url=$5, image_url=$6, bg_color=$7, display_order=$8, is_active=$9, updated_at=NOW()
             WHERE id=$10 RETURNING *`,
            [JSON.stringify(title), JSON.stringify(subtitle), description, JSON.stringify(cta_text), cta_url, image_url, bg_color, display_order ?? 0, is_active ?? true, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/landing-modules/banners/:id
router.delete('/banners/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM landing_banners WHERE id=$1', [req.params.id]);
        res.json({ message: 'Banner deleted' });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PUT /api/landing-modules/banners/:id/translations  (upsert a language)
router.put('/banners/:id/translations', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { language_code, title, subtitle, description, cta_text } = req.body;
        await pool.query(
            `INSERT INTO landing_banner_translations (banner_id, language_code, title, subtitle, description, cta_text)
             VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (banner_id, language_code) 
             DO UPDATE SET title=$3, subtitle=$4, description=$5, cta_text=$6`,
            [req.params.id, language_code, title, subtitle, description, cta_text]
        );
        res.json({ message: 'Translation saved' });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// ADMIN CRUD – Gallery
// ═══════════════════════════════════════════════════════════

router.get('/gallery', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const pageId = await getHomePageId();
        if (!pageId) return res.json([]);
        const r = await pool.query('SELECT * FROM landing_gallery_images WHERE landing_page_id=$1 ORDER BY display_order,id', [pageId]);
        res.json(r.rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/gallery', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const pageId = await getHomePageId();
        if (!pageId) return res.status(404).json({ error: 'Landing page not found' });
        const { image_url, caption, alt_text, album, display_order } = req.body;
        const r = await pool.query(
            `INSERT INTO landing_gallery_images (landing_page_id, image_url, caption, alt_text, album, display_order)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [pageId, image_url, caption, alt_text, album || 'General', display_order || 0]
        );
        res.json(r.rows[0]);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/gallery/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { image_url, caption, alt_text, album, display_order, is_active } = req.body;
        const r = await pool.query(
            `UPDATE landing_gallery_images SET image_url=$1,caption=$2,alt_text=$3,album=$4,display_order=$5,is_active=$6
             WHERE id=$7 RETURNING *`,
            [image_url, caption, alt_text, album, display_order ?? 0, is_active ?? true, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/gallery/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM landing_gallery_images WHERE id=$1', [req.params.id]);
        res.json({ message: 'Image deleted' });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// ADMIN CRUD – Videos
// ═══════════════════════════════════════════════════════════

router.get('/videos', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const pageId = await getHomePageId();
        if (!pageId) return res.json([]);
        const r = await pool.query(
            `SELECT v.*, 
                    (SELECT json_object_agg(language_code, json_build_object('title',title,'description',description))
                     FROM landing_video_translations WHERE video_id = v.id) as translations
             FROM landing_videos v WHERE landing_page_id=$1 ORDER BY display_order,id`,
            [pageId]
        );
        res.json(r.rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/videos', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const pageId = await getHomePageId();
        if (!pageId) return res.status(404).json({ error: 'Landing page not found' });
        const { title, description, video_url, thumbnail_url, display_order } = req.body;
        const r = await pool.query(
            `INSERT INTO landing_videos (landing_page_id, title, description, video_url, thumbnail_url, display_order)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [pageId, title, description, video_url, thumbnail_url, display_order || 0]
        );
        res.json(r.rows[0]);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/videos/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { title, description, video_url, thumbnail_url, display_order, is_active } = req.body;
        const r = await pool.query(
            `UPDATE landing_videos SET title=$1,description=$2,video_url=$3,thumbnail_url=$4,display_order=$5,is_active=$6,updated_at=NOW()
             WHERE id=$7 RETURNING *`,
            [title, description, video_url, thumbnail_url, display_order ?? 0, is_active ?? true, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/videos/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM landing_videos WHERE id=$1', [req.params.id]);
        res.json({ message: 'Video deleted' });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/videos/:id/translations', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { language_code, title, description } = req.body;
        await pool.query(
            `INSERT INTO landing_video_translations (video_id, language_code, title, description)
             VALUES ($1,$2,$3,$4) ON CONFLICT (video_id, language_code) DO UPDATE SET title=$3, description=$4`,
            [req.params.id, language_code, title, description]
        );
        res.json({ message: 'Translation saved' });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// ADMIN CRUD – Testimonials
// ═══════════════════════════════════════════════════════════

router.get('/testimonials', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const pageId = await getHomePageId();
        if (!pageId) return res.json([]);
        const r = await pool.query(
            `SELECT t.*, 
                    (SELECT json_object_agg(language_code, json_build_object('quote',quote,'author_role',author_role))
                     FROM landing_testimonial_translations WHERE testimonial_id = t.id) as translations
             FROM landing_testimonials t WHERE landing_page_id=$1 ORDER BY display_order,id`,
            [pageId]
        );
        res.json(r.rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/testimonials', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const pageId = await getHomePageId();
        if (!pageId) return res.status(404).json({ error: 'Landing page not found' });
        const { author_name, author_role, author_avatar, rating, display_order, quote } = req.body;
        const r = await pool.query(
            `INSERT INTO landing_testimonials (landing_page_id, author_name, author_role, author_avatar, rating, display_order, quote)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [pageId, author_name, author_role, author_avatar, rating || 5, display_order || 0, quote || '']
        );
        res.json(r.rows[0]);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/testimonials/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { author_name, author_role, author_avatar, rating, display_order, is_active, quote } = req.body;
        const r = await pool.query(
            `UPDATE landing_testimonials SET author_name=$1, author_role=$2, author_avatar=$3, rating=$4, display_order=$5, is_active=$6, quote=$7, updated_at=NOW()
             WHERE id=$8 RETURNING *`,
            [author_name, author_role, author_avatar, rating ?? 5, display_order ?? 0, is_active ?? true, quote || '', req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/testimonials/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM landing_testimonials WHERE id=$1', [req.params.id]);
        res.json({ message: 'Testimonial deleted' });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/testimonials/:id/translations', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { language_code, quote, author_role } = req.body;
        await pool.query(
            `INSERT INTO landing_testimonial_translations (testimonial_id, language_code, quote, author_role)
             VALUES ($1,$2,$3,$4) ON CONFLICT (testimonial_id, language_code) DO UPDATE SET quote=$3, author_role=$4`,
            [req.params.id, language_code, quote, author_role]
        );
        res.json({ message: 'Translation saved' });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
