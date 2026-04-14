
import { Router, Response } from 'express';
import client from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware to ensure user is a teacher or admin
const authorizeTeacher = (req: AuthRequest, res: Response, next: any) => {
    if (req.user?.role !== 'teacher' && req.user?.role !== 'admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied: Teacher permissions required' });
    }
    next();
};

// GET /api/teacher/my-modules
router.get('/my-modules', authenticateToken, authorizeTeacher, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'manager';
        
        const query = isAdmin 
            ? `SELECT id, name FROM modules ORDER BY name ASC`
            : `SELECT m.id, m.name
               FROM modules m
               JOIN user_modules um ON m.id = um.module_id
               WHERE um.user_id = $1
               ORDER BY m.name ASC`;
        
        const params = isAdmin ? [] : [userId];
        const result = await client.query(query, params);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching teacher modules:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/teacher/students-pool
router.get('/students-pool', authenticateToken, authorizeTeacher, async (req: AuthRequest, res: Response) => {
    try {
        const result = await client.query(`
            SELECT u.id, u.name, u.email
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = 'student'
            ORDER BY u.name ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching student pool:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/teacher/module-enrollments/:moduleId
router.get('/module-enrollments/:moduleId', authenticateToken, authorizeTeacher, async (req: AuthRequest, res: Response) => {
    const { moduleId } = req.params;
    const teacherId = req.user?.id;

    try {
        // Verify teacher belongs to this module
        const check = await client.query('SELECT 1 FROM user_modules WHERE user_id = $1 AND module_id = $2', [teacherId, moduleId]);
        if (check.rowCount === 0 && req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'You are not assigned to this module' });
        }

        const result = await client.query(`
            SELECT u.id, u.name, u.email
            FROM users u
            JOIN user_modules um ON u.id = um.user_id
            WHERE um.module_id = $1
            AND u.id IN (SELECT user_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'student')
        `, [moduleId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching module enrollments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/teacher/enroll
router.post('/enroll', authenticateToken, authorizeTeacher, async (req: AuthRequest, res: Response) => {
    const { studentId, moduleId } = req.body;
    const teacherId = req.user?.id;

    if (!studentId || !moduleId) {
        return res.status(400).json({ message: 'Student ID and Module ID are required' });
    }

    try {
        // 1. Verify teacher belongs to this module
        const check = await client.query('SELECT 1 FROM user_modules WHERE user_id = $1 AND module_id = $2', [teacherId, moduleId]);
        if (check.rowCount === 0 && req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied: You do not manage this module' });
        }

        // 2. Perform enrollment
        await client.query(`
            INSERT INTO user_modules (user_id, module_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `, [studentId, moduleId]);

        // Log Activity
        await client.query(`
            INSERT INTO activity_log (user_id, action, module, details)
            VALUES ($1, 'ENROLL_STUDENT', 'TEACHER', $2)
        `, [teacherId, `Teacher enrolled student ${studentId} into module ${moduleId}`]);

        res.json({ message: 'Student enrolled successfully' });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ message: 'Failed to enroll student' });
    }
});

// DELETE /api/teacher/unenroll/:studentId/:moduleId
router.delete('/unenroll/:studentId/:moduleId', authenticateToken, authorizeTeacher, async (req: AuthRequest, res: Response) => {
    const { studentId, moduleId } = req.params;
    const teacherId = req.user?.id;

    try {
        // 1. Verify teacher belongs to this module
        const check = await client.query('SELECT 1 FROM user_modules WHERE user_id = $1 AND module_id = $2', [teacherId, moduleId]);
        if (check.rowCount === 0 && req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied: You do not manage this module' });
        }

        // 2. Remove enrollment
        await client.query('DELETE FROM user_modules WHERE user_id = $1 AND module_id = $2', [studentId, moduleId]);

        // Log Activity
        await client.query(`
            INSERT INTO activity_log (user_id, action, module, details)
            VALUES ($1, 'UNENROLL_STUDENT', 'TEACHER', $2)
        `, [teacherId, `Teacher unenrolled student ${studentId} from module ${moduleId}`]);

        res.json({ message: 'Student unenrolled successfully' });
    } catch (error) {
        console.error('Unenrollment error:', error);
        res.status(500).json({ message: 'Failed to unenroll student' });
    }
});

export default router;
