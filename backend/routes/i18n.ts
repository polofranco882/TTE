import express from 'express';
import { Pool } from 'pg';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// GET /i18n/locales - Fetch all translations grouped by language natively
router.get('/locales', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM i18n_labels WHERE is_active = true');
        
        const locales: any = {};
        const excludeCols = ['key', 'module', 'is_active', 'updated_at'];
        
        // Find existing language columns dynamically
        if (result.rows.length > 0) {
             const columns = Object.keys(result.rows[0]);
             columns.forEach(col => {
                 if (!excludeCols.includes(col)) {
                     locales[col] = { translation: {} };
                 }
             });
        } else {
             // Fallback
             locales.en = { translation: {} };
             locales.es = { translation: {} };
             locales.pt = { translation: {} };
        }
        
        for (const row of result.rows) {
            Object.keys(locales).forEach(lang => {
                if (row[lang]) {
                    locales[lang].translation[row.key] = row[lang];
                }
            });
        }
        
        res.json(locales);
    } catch (error: any) {
        console.error('Error fetching i18n locales:', error.message);
        res.status(500).json({ error: 'Server error retrieving translations' });
    }
});

// GET /i18n/admin/keys - Fetch all translations for the CMS Table view
router.get('/admin/keys', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM i18n_labels ORDER BY module, key');
        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching i18n keys for admin:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /i18n/admin/keys - Update or Create a translation key
router.post('/admin/keys', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const payload = req.body;
        const key = payload.key;
        const module = payload.module || 'general';
        const en = payload.en;
        
        if (!key || !en) {
            return res.status(400).json({ error: 'Key and EN (English fallback) are required' });
        }

        const excludeCols = ['key', 'module', 'is_active', 'updated_at'];
        const languageKeys = Object.keys(payload).filter(k => !excludeCols.includes(k));

        const columns = ['key', 'module', ...languageKeys];
        const values = [key, module, ...languageKeys.map(lang => payload[lang] || null)];
        
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        const updates = ['module = EXCLUDED.module', 'updated_at = NOW()'];
        languageKeys.forEach(lang => {
            updates.push(`"${lang}" = EXCLUDED."${lang}"`);
        });

        const query = `
            INSERT INTO i18n_labels (${columns.map(c => `"${c}"`).join(', ')}, updated_at)
            VALUES (${placeholders}, NOW())
            ON CONFLICT (key) DO UPDATE 
            SET ${updates.join(', ')}
        `;
        
        await pool.query(query, values);
        
        res.json({ message: 'Translation updated successfully' });
    } catch (error: any) {
        console.error('Error updating translation:', error.message);
        res.status(500).json({ error: 'Server error updating translation' });
    }
});

// DELETE /i18n/admin/keys/:key - Delete a translation key
router.delete('/admin/keys/:key', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const key = req.params.key;
        await pool.query('DELETE FROM i18n_labels WHERE key = $1', [key]);
        res.json({ message: 'Translation deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting translation:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
