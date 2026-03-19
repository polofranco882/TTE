const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function resetSequences() {
    const connectionString = process.argv[2];
    if (!connectionString) {
        console.error('Usage: node reset_sequences.js <connection_string>');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const tables = [
            'users', 
            'roles', 
            'books', 
            'book_contents', 
            'activity_log', 
            'ai_config'
        ];

        for (const table of tables) {
            console.log(`Resetting sequence for app.${table}...`);
            // This query finds the maximum ID and sets the next value of the sequence to MAX(id) + 1
            const query = `
                SELECT setval(
                    pg_get_serial_sequence('app.${table}', 'id'), 
                    COALESCE((SELECT MAX(id) FROM app.${table}), 0) + 1, 
                    false
                )
            `;
            await client.query(query);
        }

        console.log('SUCCESS: All sequences have been reset!');

    } catch (err) {
        console.error('ERROR resetting sequences:', err.message);
    } finally {
        await client.end();
    }
}

resetSequences();
