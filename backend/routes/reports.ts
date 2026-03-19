
import { Router } from 'express';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import client from '../db';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'secret';

// Middleware to verify token (duplicated from books.ts for now to keep it self-contained)
const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Report / KPI Route
router.get('/kpi', authenticateToken, async (req: any, res: any) => {
    // Only Admin/Manager
    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // 1. Total Users
        const userCount = await client.query("SELECT COUNT(*) FROM users WHERE status = 'active'");

        // 2. Total Books Assigned
        const assignmentCount = await client.query("SELECT COUNT(*) FROM user_books");

        // 3. Reading Progress (Active vs Completed)
        const statusDist = await client.query(`
            SELECT assignment_status, COUNT(*) as count 
            FROM user_books 
            GROUP BY assignment_status
        `);

        // 4. Per Book Statistics (Book 1 - Book 12 focus)
        const bookStats = await client.query(`
            SELECT b.title, 
                   COUNT(ub.user_id) as total_assigned,
                   SUM(CASE WHEN ub.assignment_status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                   SUM(CASE WHEN ub.assignment_status = 'in_progress' THEN 1 ELSE 0 END) as active_count
            FROM books b
            LEFT JOIN user_books ub ON b.id = ub.book_id
            WHERE b.title LIKE 'Book %'
            GROUP BY b.id, b.title
            ORDER BY b.id ASC
        `);

        // 5. "Apertura" / Engagement
        const activeUsersLast24h = await client.query(`
            SELECT COUNT(DISTINCT user_id) 
            FROM activity_log 
            WHERE created_at > NOW() - INTERVAL '24 HOURS'
        `);

        res.json({
            totalUsers: parseInt(userCount.rows[0].count),
            totalAssignments: parseInt(assignmentCount.rows[0].count),
            activeUsers24h: parseInt(activeUsersLast24h.rows[0].count),
            statusDistribution: statusDist.rows.map(r => ({ name: r.assignment_status, value: parseInt(r.count) })),
            bookStats: bookStats.rows.map(r => ({
                name: r.title,
                completed: parseInt(r.completed_count),
                active: parseInt(r.active_count),
                total: parseInt(r.total_assigned)
            }))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
