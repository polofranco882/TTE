import client from './db';
import nodemailer from 'nodemailer';
import { decryptString } from './utils/encryption';

const BATCH_SIZE = 10;

export const processEmailQueue = async () => {
    try {
        const campaignsRes = await client.query(`
            SELECT c.*, s.host, s.port, s.secure, s.auth_user, s.auth_pass, s.from_name, s.from_email, s.reply_to 
            FROM email_campaigns c
            JOIN email_sender_configs s ON c.sender_id = s.id
            WHERE c.status = 'processing'
        `);

        if (campaignsRes.rows.length === 0) return;

        for (const campaign of campaignsRes.rows) {
            const contactsRes = await client.query(`
                SELECT * FROM email_contacts 
                WHERE campaign_id = $1 AND status = 'pending' 
                LIMIT $2
            `, [campaign.id, BATCH_SIZE]);

            const contacts = contactsRes.rows;

            if (contacts.length === 0) {
                await client.query(`UPDATE email_campaigns SET status = 'completed', updated_at = NOW() WHERE id = $1`, [campaign.id]);
                continue;
            }

            const pass = decryptString(campaign.auth_pass);
            const transporter = nodemailer.createTransport({
                host: campaign.host,
                port: campaign.port,
                secure: campaign.secure,
                auth: {
                    user: campaign.auth_user,
                    pass: pass
                }
            });

            for (const contact of contacts) {
                try {
                    let customizedSubject = campaign.subject
                        .replace(/{{name}}/g, contact.name || '')
                        .replace(/{{email}}/g, contact.email || '')
                        .replace(/{{telephone}}/g, contact.telephone || '');

                    let customizedBody = campaign.body_html
                        .replace(/{{name}}/g, contact.name || '')
                        .replace(/{{email}}/g, contact.email || '')
                        .replace(/{{telephone}}/g, contact.telephone || '');

                    const mailOptions = {
                        from: `"${campaign.from_name}" <${campaign.from_email}>`,
                        replyTo: campaign.reply_to || campaign.from_email,
                        to: contact.email,
                        subject: customizedSubject,
                        html: customizedBody
                    };

                    await transporter.sendMail(mailOptions);

                    await client.query(`UPDATE email_contacts SET status = 'sent', sent_at = NOW() WHERE id = $1`, [contact.id]);

                    await client.query(`
                        INSERT INTO email_campaign_logs (campaign_id, contact_id, event_type, snapshot_body)
                        VALUES ($1, $2, 'SENT', $3)
                    `, [campaign.id, contact.id, customizedBody]);

                } catch (error: any) {
                    console.error(`Failed to send email to ${contact.email}`, error);
                    await client.query(`UPDATE email_contacts SET status = 'failed', error_reason = $2 WHERE id = $1`, [contact.id, error.message?.substring(0, 500) || 'Unknown Error']);
                    await client.query(`
                        INSERT INTO email_campaign_logs (campaign_id, contact_id, event_type, error_details)
                        VALUES ($1, $2, 'FAILED', $3)
                    `, [campaign.id, contact.id, error.message || 'Unknown Error']);
                }
            }
            
            await updateCampaignMetrics(campaign.id);
        }
        
    } catch (e) {
        console.error("Error in processEmailQueue", e);
    }
}

async function updateCampaignMetrics(campaignId: number) {
    const statsRes = await client.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
        FROM email_contacts
        WHERE campaign_id = $1
    `, [campaignId]);
    
    const s = statsRes.rows[0];
    const metrics = {
        total: parseInt(s.total) || 0,
        sent: parseInt(s.sent) || 0,
        failed: parseInt(s.failed) || 0,
        pending: parseInt(s.pending) || 0
    };
    
    await client.query(`UPDATE email_campaigns SET metrics_json = $1, updated_at = NOW() WHERE id = $2`, [JSON.stringify(metrics), campaignId]);
}

export const initWorker = () => {
    console.log("[Worker] Email sender queue initialized: checking every 5 seconds.");
    setInterval(processEmailQueue, 5000);
}
