const { Client } = require('pg');

async function getPagesSchema() {
    const client = new Client({ connectionString: 'postgresql://postgres:sa@localhost:5432/TTE' });
    try {
        await client.connect();
        
        // This query works for PostgreSQL to describe a table
        const res = await client.query(`
            SELECT 
                column_name, 
                data_type, 
                character_maximum_length,
                is_nullable,
                column_default
            FROM 
                information_schema.columns 
            WHERE 
                table_name = 'pages'
            ORDER BY 
                ordinal_position;
        `);
        
        console.log('--- PAGES TABLE COLUMNS ---');
        res.rows.forEach(r => {
            console.log(`${r.column_name}: ${r.data_type}${r.character_maximum_length ? '('+r.character_maximum_length+')' : ''} ${r.is_nullable === 'NO' ? 'NOT NULL' : ''} ${r.column_default ? 'DEFAULT '+r.column_default : ''}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

getPagesSchema();
