import express from 'express';
import client from '../db';
import { encryptString, decryptString } from '../utils/encryption';
import nodemailer from 'nodemailer';

const router = express.Router();

/* ========================================================
   SENDER CONFIGS
   ======================================================== */

router.get('/configs', async (req, res) => {
    try {
        const { rows } = await client.query('SELECT id, name, host, port, secure, auth_user, from_name, from_email, reply_to, is_active FROM email_sender_configs ORDER BY id DESC');
        res.json(rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/configs', async (req, res) => {
    try {
        const { name, host, port, secure, auth_user, auth_pass, from_name, from_email, reply_to } = req.body;
        
        // Encrypt password before saving
        const encryptedPass = encryptString(auth_pass);
        
        const { rows } = await client.query(`
            INSERT INTO email_sender_configs (name, host, port, secure, auth_user, auth_pass, from_name, from_email, reply_to)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `, [name, host, port, secure, auth_user, encryptedPass, from_name, from_email, reply_to]);
        
        res.status(201).json({ success: true, id: rows[0].id });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/configs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, host, port, secure, auth_user, auth_pass, from_name, from_email, reply_to } = req.body;
        
        if (auth_pass) {
            const encryptedPass = encryptString(auth_pass);
            await client.query(`
                UPDATE email_sender_configs 
                SET name=$1, host=$2, port=$3, secure=$4, auth_user=$5, auth_pass=$6, from_name=$7, from_email=$8, reply_to=$9
                WHERE id=$10
            `, [name, host, port, secure, auth_user, encryptedPass, from_name, from_email, reply_to, id]);
        } else {
            await client.query(`
                UPDATE email_sender_configs 
                SET name=$1, host=$2, port=$3, secure=$4, auth_user=$5, from_name=$6, from_email=$7, reply_to=$8
                WHERE id=$9
            `, [name, host, port, secure, auth_user, from_name, from_email, reply_to, id]);
        }
        
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/configs/:id', async (req, res) => {
    try {
        await client.query('DELETE FROM email_sender_configs WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/configs/test', async (req, res) => {
    try {
        let { host, port, secure, auth_user, auth_pass } = req.body;
        
        // If testing an existing config and password is masked
        if (!auth_pass && req.body.id) {
            const rowRes = await client.query('SELECT auth_pass FROM email_sender_configs WHERE id = $1', [req.body.id]);
            if (rowRes.rows.length > 0) {
                auth_pass = decryptString(rowRes.rows[0].auth_pass);
            }
        }

        const transporter = nodemailer.createTransport({
            host, port, secure,
            auth: { user: auth_user, pass: auth_pass }
        });

        await transporter.verify();
        res.json({ success: true, message: 'Verificación SMTP Exitosa.' });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/* ========================================================
   CAMPAIGNS
   ======================================================== */

router.get('/campaigns', async (req, res) => {
    try {
        const { rows } = await client.query('SELECT id, name, subject, status, metrics_json, created_at FROM email_campaigns ORDER BY created_at DESC');
        res.json(rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/campaigns/:id', async (req, res) => {
    try {
        const { rows } = await client.query('SELECT * FROM email_campaigns WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Campaña no encontrada' });
        
        const campaign = rows[0];
        
        // Fetch sender limited info
        if (campaign.sender_id) {
             const senderRes = await client.query('SELECT name, from_email FROM email_sender_configs WHERE id = $1', [campaign.sender_id]);
             campaign.senderConfig = senderRes.rows[0];
        }

        res.json(campaign);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/campaigns', async (req, res) => {
    try {
        const { name, description, subject, body_html, sender_id, contacts } = req.body;
        
        // Transaction to ensure campaign and contacts are saved together
        await client.query('BEGIN');
        
        const cRes = await client.query(`
            INSERT INTO email_campaigns (name, description, subject, body_html, sender_id, status)
            VALUES ($1, $2, $3, $4, $5, 'draft')
            RETURNING id
        `, [name, description, subject, body_html, sender_id]);
        
        const campaignId = cRes.rows[0].id;
        
        // Insert contacts mapping
        // Contacts comes from frontend array: { name, email, telephone }
        if (contacts && contacts.length > 0) {
            // Bulk insert construction (pg parameter limits apply, standard limits are 65535 parameters)
            // For thousands of rows, best to slice chunks, but for < 10k rows usually fits one parameterized block:
            const values: any[] = [];
            const placeholders = contacts.map((c: any, i: number) => {
                const b = i * 4;
                values.push(campaignId, c.name || null, c.email, c.telephone || null);
                return `($${b+1}, $${b+2}, $${b+3}, $${b+4})`;
            }).join(',');

            await client.query(`
                INSERT INTO email_contacts (campaign_id, name, email, telephone)
                VALUES ${placeholders}
            `, values);
            
            // Initial metrics Update
            const metrics = { total: contacts.length, sent: 0, failed: 0, pending: contacts.length };
            await client.query(`UPDATE email_campaigns SET metrics_json = $1 WHERE id = $2`, [JSON.stringify(metrics), campaignId]);
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, id: campaignId });
    } catch (e: any) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    }
});

// Change Status (Play, Pause)
router.post('/campaigns/:id/status', async (req, res) => {
    try {
        const { status } = req.body; // 'processing', 'paused'
        const campaignId = req.params.id;
        
        await client.query('UPDATE email_campaigns SET status = $1, updated_at = NOW() WHERE id = $2', [status, campaignId]);
        
        res.json({ success: true, newStatus: status });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/* ========================================================
   LOGS AND REPORTING
   ======================================================== */

router.get('/campaigns/:id/logs', async (req, res) => {
    try {
        const { rows } = await client.query(`
            SELECT cl.*, c.email, c.name
            FROM email_campaign_logs cl
            LEFT JOIN email_contacts c ON cl.contact_id = c.id
            WHERE cl.campaign_id = $1
            ORDER BY cl.created_at DESC
            LIMIT 500
        `, [req.params.id]);
        res.json(rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
