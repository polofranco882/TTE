
const { Client } = require('pg');

const config = {
    host: 'localhost',
    user: 'postgres',
    password: 'sa',
    port: 5432,
    database: 'TTE' // Target the new DB
};

async function seedBooksAndStats() {
    const client = new Client(config);
    try {
        await client.connect();

        // 1. Create Books 1-12
        console.log('Seeding Books 1-12...');
        const books = [];
        for (let i = 1; i <= 12; i++) {
            books.push(`('Book ${i}', 'English Course', 'active', '{"level": ${i}}')`);
        }

        // Clear existing books to avoid dupes/mess (optional, but cleaner for demo)
        // await client.query('DELETE FROM books'); // Keep existing if needed, but for Books 1-12 we might want fresh start or append
        // Let's just append or ignore conflicts if we had unique constraints (we don't on title).
        // For this demo, let's truncate to clean up the "Reading Progress" visualization.
        await client.query('TRUNCATE TABLE user_books CASCADE');
        await client.query('TRUNCATE TABLE books CASCADE');

        await client.query(`
            INSERT INTO books (title, category, status, metadata) 
            VALUES ${books.join(', ')}
        `);

        // 2. Assign Books to Users with statuses
        // Get Users
        const userRes = await client.query("SELECT id FROM users WHERE email LIKE 'user%'");
        const userIds = userRes.rows.map(r => r.id);

        // Get Book IDs
        const bookRes = await client.query("SELECT id, title FROM books");
        const bookRows = bookRes.rows;

        console.log('Assigning random progress...');
        const assignments = [];

        // Randomly assign books to users
        for (const uid of userIds) {
            // Each user gets assigned random books
            for (const book of bookRows) {
                if (Math.random() > 0.3) { // 70% chance to have the book
                    const status = Math.random() > 0.5 ? 'completed' : 'in_progress';
                    assignments.push(`(${uid}, ${book.id}, '${status}')`);
                }
            }
        }

        if (assignments.length > 0) {
            await client.query(`
               INSERT INTO user_books (user_id, book_id, assignment_status) 
               VALUES ${assignments.join(', ')}
           `);
        }

        console.log('Seeding Complete!');

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

seedBooksAndStats();
