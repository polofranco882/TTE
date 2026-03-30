
const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function cleanup() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    try {
        console.log('Searching for rows with Base64 content...');
        const res = await client.query("SELECT id, content FROM book_contents WHERE content::text LIKE '%data:video%' OR content::text LIKE '%data:audio%'");
        console.log(`Found ${res.rows.length} rows with potential Base64 media.`);

        for (const row of res.rows) {
            let content = row.content;
            let blocks = Array.isArray(content) ? content : (content.blocks || []);
            let modified = false;

            const cleanBlocks = blocks.map(block => {
                if (block.data) {
                    ['url', 'previewUrl', 'audioUrl'].forEach(key => {
                        if (typeof block.data[key] === 'string' && block.data[key].startsWith('data:') && block.data[key].length > 10000) {
                            console.log(`Cleaning block ${block.id} in row ${row.id} (Field: ${key}, Length: ${block.data[key].length})`);
                            block.data[key] = ''; // Remove the giant Base64
                            modified = true;
                        }
                    });
                }
                return block;
            });

            if (modified) {
                const newContent = Array.isArray(content) ? cleanBlocks : { ...content, blocks: cleanBlocks };
                await client.query('UPDATE book_contents SET content = $1 WHERE id = $2', [JSON.stringify(newContent), row.id]);
                console.log(`Row ${row.id} updated.`);
            }
        }
        console.log('Cleanup complete.');
    } catch (e) {
        console.error('Error during cleanup:', e);
    } finally {
        await client.end();
    }
}
cleanup();
