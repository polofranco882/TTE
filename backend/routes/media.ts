import express from 'express';
import { Pool } from 'pg';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

dotenv.config();

// Set the static ffmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * Helper to process video with ffmpeg
 */
const processVideo = (inputPath: string, outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .size('?x480')
            .videoCodec('libx264')
            .audioCodec('aac')
            .audioBitrate('96k')
            .outputOptions([
                '-crf', '30',
                '-preset', 'ultrafast',
                '-movflags', '+faststart'
            ])
            .toFormat('mp4')
            .on('start', (commandLine) => {
                console.log('Ffmpeg Command:', commandLine);
            })
            .on('end', () => resolve())
            .on('error', (err, stdout, stderr) => {
                console.error('Ffmpeg Error:', err.message);
                console.error('Ffmpeg Stderr:', stderr);
                reject(new Error(`ffmpeg exited with code ${err.message}. Stderr: ${stderr}`));
            })
            .save(outputPath);
    });
};

// POST /media/upload - Save an optimized base64 asset
router.post('/upload', authenticateToken, authorizeAdmin, async (req, res) => {
    let tempInput: string | null = null;
    let tempOutput: string | null = null;

    try {
        const { module, entity_type, file_name, mime_type, base64_content, size, width, height } = req.body;
        
        if (!base64_content || !mime_type) {
            return res.status(400).json({ error: 'Missing required media fields (base64_content, mime_type)' });
        }
        
        let finalContent = base64_content;
        let finalMime = mime_type;
        let finalSize = size;
        let finalWidth = width || 0;
        let finalHeight = height || 0;

        // --- VIDEO OPTIMIZATION LOGIC ---
        if (mime_type.startsWith('video/')) {
            const tempDir = os.tmpdir();
            tempInput = path.join(tempDir, `input_${Date.now()}.mov`); // Use .mov for reliable format identification
            tempOutput = path.join(tempDir, `output_${Date.now()}.mp4`);

            // Extract the actual base64 if it has a data URI prefix
            const b64Data = base64_content.split(';base64,').pop() || base64_content;
            
            // Write to temp file
            fs.writeFileSync(tempInput, Buffer.from(b64Data, 'base64'));

            // Transcode
            console.log(`Optimizing video: ${file_name}...`);
            await processVideo(tempInput, tempOutput);

            // Read back optimized content
            const optimizedBuffer = fs.readFileSync(tempOutput);
            finalContent = optimizedBuffer.toString('base64');
            finalMime = 'video/mp4'; // Always MP4 for best compatibility
            finalSize = optimizedBuffer.length;
            
            // Clean up
            if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
            tempInput = null;
            tempOutput = null;
            
            console.log(`Video optimized: ${finalSize} bytes`);
        } else {
            // Backend Hard Limit: Reject > 7MB for non-video assets to protect Postgres memory
            if (base64_content.length > 7000000) {
                return res.status(413).json({ error: 'Payload too large. Images must be compressed under 5MB.' });
            }
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
            finalMime, 
            finalContent, 
            finalSize || finalContent.length, 
            finalWidth, 
            finalHeight
        ]);
        
        res.json({ message: 'Media uploaded successfully', asset: result.rows[0] });
    } catch (error: any) {
        console.error('Error uploading/optimizing media:', error.message);
        
        // Final cleanup on error
        if (tempInput && fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (tempOutput && fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);

        res.status(500).json({ error: 'Server error processing media upload: ' + error.message });
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
        
        const { mime_type, base64_content } = result.rows[0];
        
        // Remove data URI prefix if it accidentally got stored
        const b64Data = base64_content.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(b64Data, 'base64');

        // Prepare standard media headers
        res.setHeader('Content-Type', mime_type);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');

        // Handle HTML5 Video/Audio Range Requests
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            let start = parseInt(parts[0], 10);
            let end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1;
            
            // Hyper-permissive bounds checking
            if (isNaN(start)) start = 0;
            if (isNaN(end) || end >= buffer.length) end = buffer.length - 1;

            if (start > end || start >= buffer.length) {
                res.status(416).setHeader('Content-Range', `bytes */${buffer.length}`);
                return res.end();
            }

            const chunksize = (end - start) + 1;
            
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${buffer.length}`);
            res.setHeader('Content-Length', chunksize);
            res.end(buffer.slice(start, end + 1));
        } else {
            // Full content response for images and non-range requests
            res.setHeader('Content-Length', buffer.length);
            res.status(200).end(buffer);
        }
    } catch (error: any) {
        console.error('Error fetching media:', error.message);
        res.status(500).json({ error: 'Server error retrieving media' });
    }
});

export default router;
