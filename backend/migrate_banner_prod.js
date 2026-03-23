const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL || 'postgresql://doadmin:PASSWORD@HOST:PORT/tte?sslmode=require';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const BANNER_DATA = {
    landing_page_slug: 'home',
    badge_text: {
        en: 'TTESOL ENGLISH ACADEMIC',
        es: 'TTESOL ACADEMIA DE INGLÉS',
        pt: 'TTESOL ACADEMIA DE INGLÊS'
    },
    title: {
        en: 'Global English',
        es: 'Inglés Global',
        pt: 'Inglês Global'
    },
    subtitle: {
        en: 'Your passport to global success. Join the most advanced English learning platform.',
        es: 'Tu pasaporte al éxito global. Únete a la plataforma de aprendizaje de inglés más avanzada.',
        pt: 'Seu passaporte para o sucesso global. Junte-se à plataforma de aprendizado de inglês mais avançada.'
    },
    cta_text: {
        en: 'Join Now',
        es: 'Únete Ahora',
        pt: 'Inscreva-se Agora'
    }
};

async function run() {
    try {
        await client.connect();
        console.log('Connected to tte database.');
        await client.query('SET search_path TO app;');

        // 1. Get Home Page ID
        const pageRes = await client.query("SELECT id FROM landing_pages WHERE slug = 'home'");
        if (pageRes.rows.length === 0) {
            console.log('Home page not found. Creating it...');
            const insertPage = await client.query("INSERT INTO landing_pages (slug, is_active) VALUES ('home', true) RETURNING id");
            pageId = insertPage.rows[0].id;
        } else {
            pageId = pageRes.rows[0].id;
        }

        // 2. Clear existing banners to ensure clean sync
        await client.query('DELETE FROM landing_banners WHERE landing_page_id = $1', [pageId]);

        // 3. Insert Base Banner (English as default)
        const bannerRes = await client.query(`
            INSERT INTO landing_banners 
            (landing_page_id, title, subtitle, cta_text, badge_text, display_order, is_active)
            VALUES ($1, $2, $3, $4, $5, 0, true)
            RETURNING id
        `, [pageId, BANNER_DATA.title.en, BANNER_DATA.subtitle.en, BANNER_DATA.cta_text.en, BANNER_DATA.badge_text.en]);
        
        const bannerId = bannerRes.rows[0].id;
        console.log(`Banner created with ID: ${bannerId}`);

        // 4. Insert Translations
        const languages = ['en', 'es', 'pt'];
        for (const lang of languages) {
            await client.query(`
                INSERT INTO landing_banner_translations 
                (banner_id, language_code, title, subtitle, cta_text, badge_text)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [bannerId, lang, BANNER_DATA.title[lang], BANNER_DATA.subtitle[lang], BANNER_DATA.cta_text[lang], BANNER_DATA.badge_text[lang]]);
            console.log(` - Translation added for: ${lang}`);
        }

        console.log('\nSUCCESS: Production banner migration completed.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

run();
