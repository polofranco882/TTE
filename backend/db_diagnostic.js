const { Client } = require('pg');
const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function diagnose() {
    const connectionString = process.argv[2];
    if (!connectionString) {
        console.error('Please provide the connection string');
        process.exit(1);
    }

    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const client = new Client({
        connectionString,
        ssl: isLocal ? false : { rejectUnauthorized: false }
    });

    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await client.connect();
        log('Connected successfully!');

        // Check current database name
        const dbName = await client.query('SELECT current_database()');
        log('Current Database: ' + dbName.rows[0].current_database);

        // List tables in public schema only
        log('\nTables in public schema:');
        const tables = await client.query(`
            SELECT tablename 
            FROM pg_catalog.pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);
        
        if (tables.rows.length === 0) {
            log(' No tables found in public schema!');
        } else {
            tables.rows.forEach(r => log(` - ${r.tablename}`));
        }

        // List all users in app schema with roles
        log('\nUsers and Roles in app schema:');
        try {
            const users = await client.query(`
                SELECT u.id, u.email, u.name, r.name as role_name
                FROM app.users u
                LEFT JOIN app.user_roles ur ON ur.user_id = u.id
                LEFT JOIN app.roles r ON r.id = ur.role_id
            `);
            users.rows.forEach(u => log(` - [${u.id}] ${u.email} (${u.name}) -> Role: ${u.role_name || 'NONE'}`));
        } catch (e) {
            log(' (Could not read users/roles tables)');
        }

        fs.writeFileSync('db_tables.txt', output);
        log('\nResults written to db_tables.txt');

    } catch (err) {
        log('DIAGNOSIS ERROR: ' + err.message);
    } finally {
        await client.end();
    }
}

diagnose();
