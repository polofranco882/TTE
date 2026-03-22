
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    try {
        const pages = await pool.query("SELECT id, slug FROM landing_pages");
        const sections = await pool.query("SELECT id, landing_page_id, section_key FROM landing_sections");
        
        console.log("MARKER_START");
        console.log(JSON.stringify({pages: pages.rows, sections: sections.rows}));
        console.log("MARKER_END");

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
