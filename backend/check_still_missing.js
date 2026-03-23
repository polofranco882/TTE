const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkMissing() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT key, zh, ja, fr, it, ht FROM i18n_labels WHERE zh IS NULL OR ja IS NULL OR fr IS NULL OR it IS NULL OR ht IS NULL');
        if (res.rows.length > 0) {
            console.log('--- STILL_MISSING ---');
            res.rows.forEach(r => {
                const missing = [];
                if (!r.zh) missing.push('zh');
                if (!r.ja) missing.push('ja');
                if (!r.fr) missing.push('fr');
                if (!r.it) missing.push('it');
                if (!r.ht) missing.push('ht');
                console.log(`${r.key}: [${missing.join(', ')}]`);
            });
        } else {
            console.log('No keys are missing translations for the 5 new languages.');
        }
    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkMissing();
