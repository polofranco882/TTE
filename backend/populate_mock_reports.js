const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function populate() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const client = new Client({ 
        connectionString,
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        await client.query('SET search_path TO app, public;');
        console.log('Connected to DB and search_path set.');

        // 1. Get IDs
        const studentRes = await client.query("SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'student'");
        const moduleRes = await client.query("SELECT id FROM modules LIMIT 1");

        if (studentRes.rows.length === 0 || moduleRes.rows.length === 0) {
            console.error('No students or modules found. Please create at least one of each first.');
            process.exit(1);
        }

        const studentId = studentRes.rows[0].id; // Gabriel Garcia
        const moduleId = moduleRes.rows[0].id;   // A1

        console.log(`Targeting Student ID: ${studentId}, Module ID: ${moduleId}`);

        // 2. Clear existing mock data in these specific tables to avoid duplicates during testing
        await client.query('DELETE FROM attendance');
        await client.query('DELETE FROM academic_records');

        // 3. Populate Attendance (last 30 days)
        console.log('Populating attendance...');
        const statuses = ['present', 'present', 'present', 'present', 'late', 'absent', 'present', 'present'];
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            await client.query(
                'INSERT INTO attendance (user_id, module_id, status, attendance_date, notes) VALUES ($1, $2, $3, $4, $5)',
                [studentId, moduleId, status, date.toISOString().split('T')[0], `Mock attendance day ${i}`]
            );
        }

        // 4. Populate Academic Records
        console.log('Populating academic records...');
        const recordTypes = [
            { type: 'task', title: 'Unit 1 Workbook' },
            { type: 'task', title: 'Unit 2 Exercise' },
            { type: 'exam', title: 'Midterm Level A1' },
            { type: 'participation', title: 'Oral Practice Class 12' },
            { type: 'task', title: 'Grammar Quiz' },
            { type: 'participation', title: 'Group Conversation' },
            { type: 'project', title: 'Presentation: My Family' }
        ];

        for (const rec of recordTypes) {
            const score = (7 + Math.random() * 3).toFixed(2); // Score between 7 and 10
            await client.query(
                'INSERT INTO academic_records (user_id, module_id, record_type, title, score, feedback) VALUES ($1, $2, $3, $4, $5, $6)',
                [studentId, moduleId, rec.type, rec.title, score, 'Great effort on this mock assignment!']
            );
        }

        console.log('Mock data generation complete!');
    } catch (err) {
        console.error('Population error:', err);
    } finally {
        await client.end();
    }
}

populate();
