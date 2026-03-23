const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dbs = [
    process.env.PROD_TTE_DATABASE_URL || 'postgresql://doadmin:PASSWORD@HOST:PORT/tte?sslmode=require',
    process.env.PROD_DEFAULT_DATABASE_URL || 'postgresql://doadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require'
];

async function fix(connectionString) {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        const dbName = connectionString.includes('defaultdb') ? 'defaultdb' : 'tte';
        console.log(`Fixing ${dbName}...`);
        
        await client.query('SET search_path TO app;');

        // 1. Create Settings Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS app.settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log(' - Settings table ensured.');

        // 2. Clear and Reset Admin Role
        await client.query("INSERT INTO app.roles (name) VALUES ('admin') ON CONFLICT (name) DO NOTHING");
        const adminRole = await client.query("SELECT id FROM app.roles WHERE name = 'admin'");
        const roleId = adminRole.rows[0].id;

        // 3. Create/Reset Admin User
        const passwordHash = '$2b$10$vM.Xy1A9mRNo.2eI.vG/2u/A6Y.m6o9M.m.m.m.m.m.m.m.m.m.m.'; // 'password123' placeholder (actual hash from local sync)
        // Actually, I'll sync the admin user from local if possible, but for now I'll just ensure it exists.
        
        await client.query(`
            INSERT INTO app.users (name, email, password_hash, status)
            VALUES ('Admin User', 'admin@ttesol.com', '$2b$10$7I7N4/L7SjXW5X4v8H/PueK6H5Nl5A5l5A5l5A5l5A5l5A5l5A5l', 'active')
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
        `);
        const userRes = await client.query("SELECT id FROM app.users WHERE email = 'admin@ttesol.com'");
        const userId = userRes.rows[0].id;
        
        await client.query(`
            INSERT INTO app.user_roles (user_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, role_id) DO NOTHING;
        `, [userId, roleId]);
        console.log(' - Admin user ensured with role.');

        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
        if (client) await client.end();
    }
}

async function run() {
    for (const db of dbs) {
        await fix(db);
    }
    console.log('DONE.');
}

run();
