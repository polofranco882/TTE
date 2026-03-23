const { Client } = require('pg');
const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL || 'postgresql://doadmin:PASSWORD@HOST:PORT/tte?sslmode=require';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to tte as doadmin.');
        
        await client.query('CREATE SCHEMA IF NOT EXISTS app;');
        await client.query('SET search_path TO app;');

        // Tables to drop to ensure clean state (careful with dependencies)
        const tablesToDrop = [
            'landing_banner_translations', 'landing_banners', 
            'landing_gallery_translations', 'landing_gallery_images', 
            'landing_testimonial_translations', 'landing_testimonials',
            'landing_video_translations', 'landing_videos',
            'landing_section_translations', 'landing_sections', 'landing_pages',
            'media_assets', 'activity_log', 'ai_config', 'book_contents',
            'user_books', 'user_roles', 'books', 'roles', 'users', 'sessions'
        ];
        
        console.log('Dropping existing tables in app schema...');
        for (const t of tablesToDrop) {
            await client.query(`DROP TABLE IF EXISTS app.${t} CASCADE`);
        }

        // 1. Initialize Foundations (Landing Pages & Media Assets)
        console.log('Initializing Landing Foundations...');
        await client.query(`
            CREATE TABLE app.landing_pages (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(100) UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT true,
                meta_title JSONB,
                meta_description JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE app.media_assets (
                id SERIAL PRIMARY KEY,
                module VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50),
                file_name VARCHAR(255) NOT NULL,
                mime_type VARCHAR(50) NOT NULL,
                extension VARCHAR(10),
                base64_content TEXT NOT NULL,
                optimized_size INTEGER NOT NULL,
                original_size INTEGER,
                width INTEGER,
                height INTEGER,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Apply Core Schema
        console.log('Applying full_schema.sql...');
        const coreSql = fs.readFileSync('full_schema.sql', 'utf8');
        await client.query(coreSql);

        // 3. Apply Advanced Landing Modules
        // We need to handle the fact that landing_modules_schema.sql creates some tables 
        // that might reference landing_pages or media_assets.
        console.log('Applying landing_modules_schema.sql...');
        let modulesSql = fs.readFileSync('landing_modules_schema.sql', 'utf8');
        // Replace references to ensure app schema is used
        modulesSql = modulesSql.replace(/CREATE TABLE IF NOT EXISTS /g, 'CREATE TABLE app.');
        modulesSql = modulesSql.replace(/REFERENCES /g, 'REFERENCES app.');
        await client.query(modulesSql);

        // 4. Apply Section Translations
        console.log('Applying landing_i18n_schema.sql...');
        let i18nSql = fs.readFileSync('landing_i18n_schema.sql', 'utf8');
        i18nSql = i18nSql.replace(/CREATE TABLE IF NOT EXISTS /g, 'CREATE TABLE app.');
        i18nSql = i18nSql.replace(/REFERENCES /g, 'REFERENCES app.');
        await client.query(i18nSql);
        
        console.log('\nSUCCESS: Database fully initialized in tte.app!');
        process.exit(0);
    } catch (err) {
        console.error('Initialization failed:', err.message);
        process.exit(1);
    }
}

run();
