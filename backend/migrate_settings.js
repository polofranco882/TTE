const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:sa@localhost:5432/TTE";

async function migrate() {
    const client = new Client({
        connectionString: connectionString,
        ssl: connectionString.includes('ondigitalocean') ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('Connected to DB for migration...');

        // Create schema if it doesn't exist
        await client.query('CREATE SCHEMA IF NOT EXISTS app;');

        // Create settings table
        await client.query(`
            CREATE TABLE IF NOT EXISTS app.settings (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert default welcome settings if they don't exist
        const defaultSettings = [
            ['welcome_title_top', 'Welcome to the'],
            ['welcome_title_main', 'TTESOL'],
            ['welcome_title_accent', 'English Academy'],
            ['welcome_description', 'Your English journey starts here. Explore interactive materials, enhance your skills, and master the language with our premium platform.'],
            ['feature1_title', 'Interactive Books'],
            ['feature1_desc', 'Engaging reading experience with AI.'],
            ['feature2_title', 'Expert Content'],
            ['feature2_desc', 'Curated for all levels by professionals.'],
            ['feature3_title', 'Fast Progress'],
            ['feature3_desc', 'Adaptive platform for rapid growth.']
        ];

        for (const [key, value] of defaultSettings) {
            await client.query(`
                INSERT INTO app.settings (key, value)
                VALUES ($1, $2)
                ON CONFLICT (key) DO NOTHING;
            `, [key, value]);
        }

        console.log('SUCCESS: Settings table created and initialized!');
    } catch (err) {
        console.error('ERROR during migration:', err);
    } finally {
        await client.end();
    }
}

migrate();
