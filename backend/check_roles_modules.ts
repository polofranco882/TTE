// check_roles_modules.ts
import client from './db';

async function check() {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const roles = await client.query("SELECT * FROM roles");
        console.log('Roles:', roles.rows);

        const modules = await client.query("SELECT * FROM modules");
        console.log('Modules:', modules.rows);

        // Check if "teacher" or "profesor" role exists
        const teacherRole = roles.rows.find(r => r.name.toLowerCase().includes('teacher') || r.name.toLowerCase().includes('profesor'));
        console.log('Teacher Role identified as:', teacherRole);

    } catch (err) {
        console.error('Error checking:', err);
    } finally {
        process.exit(0);
    }
}

check();
