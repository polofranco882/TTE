// apply_migration.ts
import client from './db';
import fs from 'fs';
import path from 'path';

async function apply() {
    try {
        // Wait a bit for db.ts to connect (or just use it directly, db.ts runs connect() on load)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sqlPath = path.join(__dirname, 'add_marketing_role.sql');
        if (!fs.existsSync(sqlPath)) {
            console.error('SQL file not found:', sqlPath);
            return;
        }
        
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        console.log('Applying SQL migration...');
        await client.query(sql);
        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        // We shouldn't necessarily end it if we import it from the main db file which is shared,
        // but since this is a one-off script, we can exit.
        process.exit(0);
    }
}

apply();
