
const { Client } = require('pg');

const config = {
    host: 'localhost',
    user: 'postgres',
    password: 'sa',
    port: 5432,
};

async function fixOrder() {
    const client = new Client(config);
    try {
        await client.connect();

        // 1. Get Trails to English 1
        const targetRes = await client.query("SELECT * FROM books WHERE title = 'Trails to English 1'");
        const targetBook = targetRes.rows[0];

        if (!targetBook) {
            console.log("Target book 'Trails to English 1' not found.");
            return;
        }

        // 2. Get the first book (lowest ID)
        const firstRes = await client.query("SELECT * FROM books ORDER BY id ASC LIMIT 1");
        const firstBook = firstRes.rows[0];

        if (firstBook.id === targetBook.id) {
            console.log("Trails to English 1 is already at the first position.");
            return;
        }

        console.log(`Swapping Book ${firstBook.id} (${firstBook.title}) with Book ${targetBook.id} (${targetBook.title})`);

        // 3. Swap content
        // Update first book to be Trails...
        await client.query(`
            UPDATE books 
            SET title = $1, cover_image = $2, category = $3, status = $4
            WHERE id = $5
        `, [targetBook.title, targetBook.cover_image, targetBook.category, targetBook.status, firstBook.id]);

        // Update target book to be whatever first book was (or generic placeholder)
        await client.query(`
            UPDATE books 
            SET title = $1, cover_image = $2, category = $3, status = $4
            WHERE id = $5
        `, [firstBook.title, firstBook.cover_image, firstBook.category, 'inactive', targetBook.id]);
        // Mark the old one as inactive to avoid duplicates/confusion

        console.log("Swap complete. Trails to English 1 is now at position 1.");

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

fixOrder();
