import fs from 'fs';
import path from 'path';
import client from './db';

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migration_v2.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Running migration...');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Migration completed successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runMigration();
