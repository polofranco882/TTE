require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
    });
    
    try {
        await client.connect();
        await client.query('SET search_path TO app, public;');
        
        const hash = await bcrypt.hash('password123', 10);
        
        console.log('Generated hash. Updating database...');
        const res = await client.query('UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING *', [hash, 'admin@ttesol.com']);
        
        if (res.rowCount > 0) {
            console.log('Successfully updated password for admin@ttesol.com to "password123"');
            
            // Re-verify the role just in case
            const user = res.rows[0];
            const roleRes = await client.query(`
                SELECT r.name FROM roles r
                JOIN user_roles ur ON ur.role_id = r.id
                WHERE ur.user_id = $1
            `, [user.id]);
            
            if (roleRes.rows.length > 0) {
                console.log(`User has roles: ${roleRes.rows.map(r => r.name).join(', ')}`);
            } else {
                console.log('User has NO roles. Attempting to assign admin role...');
                const roleQuery = await client.query("SELECT id FROM roles WHERE name = 'admin' LIMIT 1");
                if (roleQuery.rows.length > 0) {
                     await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user.id, roleQuery.rows[0].id]);
                     console.log('Admin role assigned successfully.');
                }
            }
        } else {
            console.log('Error: User admin@ttesol.com not found in the database.');
        }
    } catch (e) {
        console.error('Error updating password:', e);
    } finally {
        await client.end();
    }
}

run();
