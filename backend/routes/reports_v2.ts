import { Router, Request, Response } from 'express';
import client from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/reports/v2/admin
 * @desc    Global KPIs for Administrators
 * @access  Private (Admin, Manager)
 */
router.get('/admin', authenticateToken, async (req: any, res: Response) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // 1. User distribution
        const userDist = await client.query(`
            SELECT r.name, count(ur.user_id)::int as value 
            FROM roles r 
            LEFT JOIN user_roles ur ON r.id = ur.role_id 
            GROUP BY r.name
        `);

        // 2. Global academic performance (avg grade from academic_records)
        const academicAvg = await client.query(`
            SELECT COALESCE(AVG(score), 0)::float as average_grade, count(*)::int as total_records 
            FROM academic_records
        `);

        // 3. Marketing summary
        const marketingSummary = await client.query(`
            SELECT 
                (SELECT count(*)::int FROM email_campaigns) as total_campaigns,
                (SELECT count(*)::int FROM email_contacts) as total_leads,
                (SELECT count(*)::int FROM user_roles WHERE role_id = (SELECT id FROM roles WHERE name = 'student')) as total_students
        `);

        // 4. Book Engagement (from existing user_books)
        const bookEngagement = await client.query(`
            SELECT b.title, count(ub.user_id)::int as readers
            FROM books b
            LEFT JOIN user_books ub ON b.id = ub.book_id
            GROUP BY b.id, b.title
            ORDER BY readers DESC
            LIMIT 5
        `);

        // 5. Monthly User Growth
        const userGrowth = await client.query(`
            SELECT to_char(created_at, 'Mon') as month, count(*)::int as count
            FROM users
            WHERE created_at > now() - interval '6 months'
            GROUP BY month, to_char(created_at, 'MM')
            ORDER BY to_char(created_at, 'MM')
        `);

        res.json({
            userDistribution: userDist.rows,
            academic: {
                averageGrade: academicAvg.rows[0].average_grade,
                totalRecords: academicAvg.rows[0].total_records
            },
            marketing: marketingSummary.rows[0],
            topBooks: bookEngagement.rows,
            growth: userGrowth.rows
        });
    } catch (err) {
        console.error('Admin Report Error:', err);
        res.status(500).json({ message: 'Error generating admin report' });
    }
});

/**
 * @route   GET /api/reports/v2/teacher
 * @desc    Academic seguimiento for students assigned to the teacher
 */
router.get('/teacher', authenticateToken, async (req: any, res: Response) => {
    if (!['admin', 'manager', 'teacher'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        let studentQuery = `
            SELECT u.id, u.name, u.email,
                   (SELECT COALESCE(AVG(score), 0)::float FROM academic_records ar WHERE ar.user_id = u.id) as avg_score,
                   (SELECT count(*)::int FROM attendance att WHERE att.user_id = u.id AND att.status = 'present') as days_present,
                   (SELECT count(*)::int FROM attendance att WHERE att.user_id = u.id) as total_attendance_records
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = 'student'
        `;

        const queryParams: any[] = [];
        if (req.user.role === 'teacher') {
            studentQuery += ` AND u.id IN (
                SELECT um_student.user_id 
                FROM user_modules um_student 
                WHERE um_student.module_id IN (SELECT module_id FROM user_modules WHERE user_id = $1)
            )`;
            queryParams.push(req.user.id);
        }

        const students = await client.query(studentQuery, queryParams);

        // Grade distribution for Teacher context
        let gradeDistQuery = `
            SELECT 
                CASE 
                    WHEN score >= 9 THEN '9-10 (Excellent)'
                    WHEN score >= 7 THEN '7-8.9 (Good)'
                    WHEN score >= 5 THEN '5-6.9 (Notice)'
                    ELSE '0-4.9 (At Risk)'
                END as range,
                count(*)::int as count
            FROM academic_records
        `;

        const gradeParams: any[] = [];
        if (req.user.role === 'teacher') {
            gradeDistQuery += ` WHERE user_id IN (
                SELECT user_id FROM user_modules WHERE module_id IN (SELECT module_id FROM user_modules WHERE user_id = $1)
            )`;
            gradeParams.push(req.user.id);
        }
        
        gradeDistQuery += ` GROUP BY range`;

        const gradeDist = await client.query(gradeDistQuery, gradeParams);

        res.json({
            students: students.rows,
            gradeDistribution: gradeDist.rows
        });
    } catch (err) {
        console.error('Teacher Report Error:', err);
        res.status(500).json({ message: 'Error generating teacher report' });
    }
});

/**
 * @route   GET /api/reports/v2/marketing
 * @desc    Funnel and campaign analytics
 */
router.get('/marketing', authenticateToken, async (req: any, res: Response) => {
    if (!['admin', 'manager', 'marketing'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // 1. Funnel data: Contacts -> Users -> Students
        const funnel = await client.query(`
            SELECT 'Leads (Contacts)' as stage, count(*)::int as count FROM email_contacts
            UNION ALL
            SELECT 'Registered Users' as stage, count(*)::int FROM users
            UNION ALL
            SELECT 'Enrolled Students' as stage, count(*)::int FROM user_roles WHERE role_id = (SELECT id FROM roles WHERE name = 'student')
        `);

        // 2. Campaign performance
        const campaigns = await client.query(`
            SELECT 
                c.name, 
                c.sent_count, 
                (SELECT count(*)::int FROM email_campaign_logs l WHERE l.campaign_id = c.id AND l.status = 'sent') as actual_sent,
                (SELECT count(*)::int FROM email_campaign_logs l WHERE l.campaign_id = c.id AND l.opened_at IS NOT NULL) as opens,
                (SELECT count(*)::int FROM email_campaign_logs l WHERE l.campaign_id = c.id AND l.clicked_at IS NOT NULL) as clicks
            FROM email_campaigns c
            ORDER BY c.created_at DESC
            LIMIT 5
        `);

        res.json({
            funnel: funnel.rows,
            campaigns: campaigns.rows
        });
    } catch (err) {
        console.error('Marketing Report Error:', err);
        res.status(500).json({ message: 'Error generating marketing report' });
    }
});

/**
 * @route   GET /api/reports/v2/student
 * @desc    Personal academic progress for the student
 */
router.get('/student', authenticateToken, async (req: any, res: Response) => {
    // Only student or admin can see specific student report
    const targetUserId = req.query.userId ? parseInt(req.query.userId as string) : req.user.id;
    
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== targetUserId) {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // 1. Personal Academic Records
        const records = await client.query(`
            SELECT record_type, title, score, max_score, feedback, recorded_at 
            FROM academic_records 
            WHERE user_id = $1 
            ORDER BY recorded_at DESC
        `, [targetUserId]);

        // 2. Attendance Summary
        const attendance = await client.query(`
            SELECT status, count(*)::int as count 
            FROM attendance 
            WHERE user_id = $1 
            GROUP BY status
        `, [targetUserId]);

        // 3. Book Progress (from user_books)
        const books = await client.query(`
            SELECT b.title, ub.assignment_status
            FROM user_books ub
            JOIN books b ON ub.book_id = b.id
            WHERE ub.user_id = $1
        `, [targetUserId]);

        // 4. Grade Evolution (Tasks/Exams over time)
        const evolution = await client.query(`
            SELECT to_char(recorded_at, 'DD/MM') as date, COALESCE(score, 0)::float as score
            FROM academic_records
            WHERE user_id = $1
            ORDER BY recorded_at ASC
        `, [targetUserId]);

        res.json({
            records: records.rows,
            attendance: attendance.rows,
            books: books.rows,
            evolution: evolution.rows
        });
    } catch (err) {
        console.error('Student Report Error:', err);
        res.status(500).json({ message: 'Error generating student report' });
    }
});

export default router;
