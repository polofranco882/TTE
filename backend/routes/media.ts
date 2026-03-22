import express from 'express';
import { Pool } from 'pg';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// POST /media/upload - Save an optimized base64 asset
router.post('/upload', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { module, entity_type, file_name, mime_type, base64_content, size, width, height } = req.body;
        
        if (!base64_content || !mime_type) {
            return res.status(400).json({ error: 'Missing required media fields (base64_content, mime_type)' });
        }
        
        // Backend Hard Limit: Reject > 5MB to protect Postgres memory
        if (base64_content.length > 7000000) {
            return res.status(413).json({ error: 'Payload too large. Assets must be compressed under 5MB.' });
        }
        
        const result = await pool.query(`
            INSERT INTO media_assets 
            (module, entity_type, file_name, mime_type, base64_content, optimized_size, width, height)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, file_name, mime_type
        `, [
            module || 'general', 
            entity_type || 'image', 
            file_name || `upload_${Date.now()}`, 
            mime_type, 
            base64_content, 
            size || base64_content.length, 
            width || 0, 
            height || 0
        ]);
        
        res.json({ message: 'Media uploaded successfully', asset: result.rows[0] });
    } catch (error: any) {
        console.error('Error uploading media:', error.message);
        res.status(500).json({ error: 'Server error processing media upload' });
    }
});

// GET /media/:id - Fetch optimized base64 to render
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
        
        const result = await pool.query('SELECT mime_type, base64_content FROM media_assets WHERE id = $1 AND status = $2', [id, 'active']);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Media not found' });
        }
        
        // Return JSON format so Frontend can inject via src={`data:${mime_type};base64,${base64_content}`}
        res.json({ 
            mime_type: result.rows[0].mime_type, 
            base64_content: result.rows[0].base64_content 
        });
    } catch (error: any) {
        console.error('Error fetching media:', error.message);
        res.status(500).json({ error: 'Server error retrieving media' });
    }
});

export default router;
