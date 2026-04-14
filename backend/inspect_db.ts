// inspect_db.ts
import client from './db';

async function inspect() {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'app' OR table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('Tables:', tables.rows.map(r => r.table_name));

        const modulesTable = await client.query("SELECT * FROM information_schema.columns WHERE table_name = 'modules'");
        if (modulesTable.rows.length > 0) {
            console.log('Columns for modules:', modulesTable.rows.map(r => r.column_name));
        }

        const userModulesTable = await client.query("SELECT * FROM information_schema.columns WHERE table_name = 'user_modules'");
        if (userModulesTable.rows.length > 0) {
            console.log('Columns for user_modules:', userModulesTable.rows.map(r => r.column_name));
        }

    } catch (err) {
        console.error('Error inspecting:', err);
    } finally {
        process.exit(0);
    }
}

inspect();
