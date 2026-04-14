import client from './db';

async function addRoles() {
    try {
        await client.query("INSERT INTO roles (name) VALUES ('teacher'), ('student') ON CONFLICT (name) DO NOTHING");
        console.log('Roles teacher and student ensured.');
    } catch (e) {
        console.error('Error adding roles:', e);
    } finally {
        process.exit(0);
    }
}

addRoles();
