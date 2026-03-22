
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    try {
        const res = await pool.query(`
            SELECT
                conname AS constraint_name,
                pg_get_constraintdef(c.oid) AS constraint_definition
            FROM
                pg_constraint c
            JOIN
                pg_namespace n ON n.oid = c.connamespace
            WHERE
                contype = 'f' AND nspname = 'public'
                AND conrelid = 'landing_section_translations'::regclass;
        `);
        console.log(JSON.stringify(res.rows));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
