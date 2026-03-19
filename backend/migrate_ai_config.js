/**
 * Migration: Create ai_config table for AI provider configuration
 */
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:sa@localhost:5432/TTE',
});

async function migrate() {
    await client.connect();
    console.log('Connected to DB. Running ai_config migration...');

    await client.query(`
        CREATE TABLE IF NOT EXISTS ai_config (
            id              SERIAL PRIMARY KEY,
            provider        VARCHAR(20) NOT NULL DEFAULT 'openai',
            api_key         TEXT NOT NULL DEFAULT '',
            model           VARCHAR(100) DEFAULT 'gpt-image-1',
            allow_image     BOOLEAN DEFAULT TRUE,
            allow_video     BOOLEAN DEFAULT TRUE,
            max_seconds     INTEGER DEFAULT 15,
            max_resolution  VARCHAR(20) DEFAULT '1024x1024',
            max_size_mb     INTEGER DEFAULT 10,
            updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Ensure there is always exactly one config row
    const { rowCount } = await client.query('SELECT id FROM ai_config LIMIT 1');
    if (rowCount === 0) {
        await client.query(`INSERT INTO ai_config (provider) VALUES ('openai')`);
        console.log('Inserted default ai_config row.');
    }

    console.log('ai_config table ready.');
    await client.end();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
