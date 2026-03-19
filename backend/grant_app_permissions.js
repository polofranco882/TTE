/**
 * Script to grant permissions on the "app" schema to a restricted user.
 * Run this with the DOADMIN connection string.
 * 
 * Usage: node backend/grant_app_permissions.js "DOADMIN_CONNECTION_STRING" "RESTRICTED_USERNAME"
 */

const { Client } = require('pg');

// Force ignore SSL certificate errors
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.argv[2];
const restrictedUser = process.argv[3] || 'dev-db-276455';

if (!connectionString) {
    console.error('Error: Please provide the DOADMIN connection string.');
    process.exit(1);
}

async function grantPermissions() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log(`Connected as doadmin. Granting permissions to ${restrictedUser} on schema "app"...`);

        // 1. Grant usage on schema
        await client.query(`GRANT USAGE ON SCHEMA app TO "${restrictedUser}";`);
        
        // 2. Grant privileges on existing tables
        await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app TO "${restrictedUser}";`);
        
        // 3. Grant privileges on existing sequences
        await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app TO "${restrictedUser}";`);
        
        // 4. Grant privileges on future tables
        await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON TABLES TO "${restrictedUser}";`);
        await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON SEQUENCES TO "${restrictedUser}";`);

        console.log('\nSUCCESS: Permissions granted! Now the user "' + restrictedUser + '" can access the "app" schema.');
        await client.end();
    } catch (err) {
        console.error('\nERROR:', err.message);
        process.exit(1);
    }
}

grantPermissions();
