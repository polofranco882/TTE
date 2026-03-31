const { Client } = require('pg');
require('dotenv').config();

const isLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
if (!isLocal) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:sa@localhost:5432/TTE',
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

const sql = `
-- 1. Add Marketing Role
INSERT INTO roles (name) VALUES ('marketing') ON CONFLICT DO NOTHING;

-- 2. Sender Configs Table
CREATE TABLE IF NOT EXISTS email_sender_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(200) NOT NULL,
    port INTEGER NOT NULL DEFAULT 587,
    secure BOOLEAN DEFAULT false,
    auth_user VARCHAR(200) NOT NULL,
    auth_pass VARCHAR(500) NOT NULL,
    from_name VARCHAR(200) NOT NULL,
    from_email VARCHAR(200) NOT NULL,
    reply_to VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Campaigns Table
CREATE TABLE IF NOT EXISTS email_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(300) NOT NULL,
    body_html TEXT NOT NULL,
    sender_id INTEGER REFERENCES email_sender_configs(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    metrics_json JSONB DEFAULT '{}',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Contacts Queue Table
CREATE TABLE IF NOT EXISTS email_contacts (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
    name VARCHAR(200),
    email VARCHAR(200) NOT NULL,
    telephone VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    error_reason TEXT,
    sent_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Optimize query speed for the background queue worker
CREATE INDEX IF NOT EXISTS idx_email_contacts_campaign_status ON email_contacts(campaign_id, status);

-- 5. Campaign Logs Table
CREATE TABLE IF NOT EXISTS email_campaign_logs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES email_contacts(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    snapshot_body TEXT,
    error_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function init() {
    try {
        await client.connect();
        
        try {
            await client.query('SET search_path TO app, public;');
        } catch (e) {
            console.error('Error setting search_path:', e);
        }

        console.log('Running Marketing Module DB migrations...');
        await client.query(sql);
        console.log('Marketing schema successfully created!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

init();
