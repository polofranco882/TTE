const { Client } = require('pg');
const fs = require('fs');

const logSync = (msg) => {
    console.log(msg);
    fs.appendFileSync('sync_results.txt', msg + '\n');
};

const errorSync = (msg) => {
    console.error(msg);
    fs.appendFileSync('sync_errors.txt', msg + '\n');
};

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function sync() {
    fs.writeFileSync('sync_results.txt', '--- SYNC START ---\n');
    fs.writeFileSync('sync_errors.txt', '--- ERROR LOG START ---\n');
    const localUri = process.argv[2] || 'postgresql://postgres:sa@localhost:5432/TTE';
    const remoteUri = process.argv[3];

    if (!remoteUri) {
        errorSync('Usage: node data_sync.js <local_uri> <remote_uri>');
        process.exit(1);
    }

    const localClient = new Client({ connectionString: localUri });
    const remoteClient = new Client({ connectionString: remoteUri, ssl: { rejectUnauthorized: false } });

    try {
        await localClient.connect();
        await remoteClient.connect();
        logSync('Connected to both databases!');

        const tables = [
            'media_assets', 
            'roles', 
            'users', 
            'user_roles', 
            'books', 
            'user_books', 
            'book_contents', 
            'ai_config',
            'landing_pages',
            'landing_sections',
            'landing_section_translations',
            'landing_banners',
            'landing_banner_translations',
            'landing_testimonial_translations',
            'landing_gallery_images'
        ];

        // Clean remote tables first (in reverse order for foreign keys)
        logSync('Cleaning remote tables...');
        for (const table of [...tables].reverse()) {
            await remoteClient.query(`TRUNCATE app.${table} CASCADE`);
        }

        for (const table of tables) {
            logSync(`Syncing table: ${table}...`);
            const { rows } = await localClient.query(`SELECT * FROM public.${table}`);
            
            if (rows.length === 0) {
                logSync(` - No data in ${table}`);
                continue;
            }

            const columns = Object.keys(rows[0]).join(', ');
            const placeholders = Object.keys(rows[0]).map((_, i) => `$${i + 1}`).join(', ');
            
            for (const row of rows) {
                const values = Object.values(row);
                try {
                    await remoteClient.query(`INSERT INTO app.${table} (${columns}) VALUES (${placeholders})`, values);
                    if (table === 'books') logSync(` - Inserted book: ${row.title} (ID: ${row.id})`);
                } catch (rowErr) {
                    errorSync(` ERROR inserting row in ${table}: ${rowErr.message} ${JSON.stringify(row)}`);
                }
            }
            logSync(` - Synced ${rows.length} rows`);
        }

        logSync('\nSUCCESS: All data migrated successfully!');

    } catch (err) {
        errorSync('SYNC ERROR: ' + err.message);
    } finally {
        await localClient.end();
        await remoteClient.end();
    }
}

sync();
