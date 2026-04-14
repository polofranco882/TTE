
import { Router } from 'express';
import client from '../db';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createUserSchema, updateUserSchema } from '../utils/user.schema';
import bcrypt from 'bcrypt';

dotenv.config();

const router = Router();
const SECRET = process.env.JWT_SECRET || 'secret';

// Middleware to verify token and admin role
const authenticateAdmin = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        if (user.role !== 'admin') return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Meta Endpoints ---

// --- Meta Endpoints & CRUD for Academic Levels ---

router.get('/meta/academic-levels', authenticateAdmin, async (req, res) => {
    try {
        const result = await client.query(`
            SELECT al.*, m.name as module_name 
            FROM academic_levels al
            LEFT JOIN modules m ON al.module_id = m.id
            ORDER BY m.name ASC, al.id ASC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching levels' });
    }
});

router.post('/meta/academic-levels', authenticateAdmin, async (req, res) => {
    try {
        const { name, module_id } = req.body;
        if (!name || !module_id) return res.status(400).json({ message: 'Name and Module ID are required' });
        const result = await client.query(
            'INSERT INTO academic_levels (name, module_id) VALUES ($1, $2) RETURNING *', 
            [name, module_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error creating level' });
    }
});

router.put('/meta/academic-levels/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, module_id } = req.body;
        if (!name || !module_id) return res.status(400).json({ message: 'Name and Module ID are required' });
        const result = await client.query(
            'UPDATE academic_levels SET name = $1, module_id = $2 WHERE id = $3 RETURNING *', 
            [name, module_id, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Level not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating level' });
    }
});

router.delete('/meta/academic-levels/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Integrity check: PostgreSQL will handle this if foreign keys are set to RESTRICT, 
        // but we'll allow SET NULL as per plan logic (managed by DB usually, or explicit here).
        // If we want to move students to NULL, we can do it explicitly if needed, 
        // but standard SQL ON DELETE SET NULL handles it.
        await client.query('DELETE FROM academic_levels WHERE id = $1', [id]);
        res.json({ message: 'Level deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting level' });
    }
});


router.get('/meta/modules', authenticateAdmin, async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM modules ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching modules' });
    }
});

router.post('/meta/modules', authenticateAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        const result = await client.query('INSERT INTO modules (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error creating module' });
    }
});

router.put('/meta/modules/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        const result = await client.query('UPDATE modules SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Module not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating module' });
    }
});

router.delete('/meta/modules/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await client.query('DELETE FROM modules WHERE id = $1', [id]);
        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting module' });
    }
});

// --- User Management ---

// Get Users with Filters
router.get('/users', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { role, level_id, module_id } = req.query;
        
        let query = `
            SELECT u.id, u.name, u.email, u.status, u.created_at,
                   r.name as role_name,
                   ARRAY_AGG(DISTINCT m.name) FILTER (WHERE m.name IS NOT NULL) as modules,
                   ARRAY_AGG(DISTINCT al.name) FILTER (WHERE al.name IS NOT NULL) as levels,
                   ARRAY_AGG(DISTINCT al.id) FILTER (WHERE al.id IS NOT NULL) as level_ids,
                   ARRAY_AGG(DISTINCT m.id) FILTER (WHERE m.id IS NOT NULL) as module_ids
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            LEFT JOIN user_levels ul ON u.id = ul.user_id
            LEFT JOIN academic_levels al ON ul.level_id = al.id
            LEFT JOIN user_modules um ON u.id = um.user_id
            LEFT JOIN modules m ON um.module_id = m.id
        `;

        const conditions: string[] = [];
        const params: any[] = [];

        if (role) {
            params.push(role);
            conditions.push(`r.name = $${params.length}`);
        }
        if (level_id) {
            if (level_id === 'unassigned') {
                conditions.push(`NOT EXISTS (SELECT 1 FROM user_levels WHERE user_id = u.id)`);
            } else {
                params.push(level_id);
                conditions.push(`EXISTS (SELECT 1 FROM user_levels WHERE user_id = u.id AND level_id = $${params.length})`);
            }
        }

        if (module_id) {
            params.push(module_id);
            conditions.push(`EXISTS (SELECT 1 FROM user_modules WHERE user_id = u.id AND module_id = $${params.length})`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        query += ` GROUP BY u.id, r.name ORDER BY u.id ASC`;

        const result = await client.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

// Create User
router.post('/users/create', authenticateAdmin, async (req: any, res: any) => {
    try {
        const validatedData = createUserSchema.parse(req.body);
        const { name, email, password, role, level_ids, module_ids } = validatedData;

        const userExists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await client.query('BEGIN');
        try {
            const userResult = await client.query(
                'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
                [name, email, hashedPassword]
            );
            const userId = userResult.rows[0].id;

            const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [role]);
            if (roleResult.rows.length === 0) throw new Error('Role not found');
            await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleResult.rows[0].id]);

            if (level_ids && level_ids.length > 0) {
                for (const lId of level_ids) {
                    await client.query('INSERT INTO user_levels (user_id, level_id) VALUES ($1, $2)', [userId, lId]);
                }
            }

            if (module_ids && module_ids.length > 0) {
                for (const mId of module_ids) {
                    await client.query('INSERT INTO user_modules (user_id, module_id) VALUES ($1, $2)', [userId, mId]);
                }
            }

            await client.query('COMMIT');
            res.status(201).json({ message: 'User created successfully', userId });
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        }
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ message: error.message || 'Error creating user' });
    }
});

// Update User
router.put('/users/:id', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const validatedData = updateUserSchema.parse(req.body);
        const { name, email, password, role, level_ids, module_ids } = validatedData;

        await client.query('BEGIN');
        try {
            // Update base user info
            if (name || email || password) {
                let updateParts = [];
                let updateParams = [];
                if (name) { updateParams.push(name); updateParts.push(`name = $${updateParams.length}`); }
                if (email) { updateParams.push(email); updateParts.push(`email = $${updateParams.length}`); }
                if (password) { 
                    const hashedPassword = await bcrypt.hash(password, 10);
                    updateParams.push(hashedPassword); 
                    updateParts.push(`password_hash = $${updateParams.length}`); 
                }
                updateParams.push(id);
                await client.query(`UPDATE users SET ${updateParts.join(', ')} WHERE id = $${updateParams.length}`, updateParams);
            }

            // Update Role
            if (role) {
                const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [role]);
                if (roleResult.rows.length > 0) {
                    await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
                    await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [id, roleResult.rows[0].id]);
                }
            }

            // Update Levels (Many-to-Many)
            if (level_ids) {
                await client.query('DELETE FROM user_levels WHERE user_id = $1', [id]);
                for (const lId of level_ids) {
                    await client.query('INSERT INTO user_levels (user_id, level_id) VALUES ($1, $2)', [id, lId]);
                }
            }

            // Update Modules (Many-to-Many)
            if (module_ids) {
                await client.query('DELETE FROM user_modules WHERE user_id = $1', [id]);
                for (const mId of module_ids) {
                    await client.query('INSERT INTO user_modules (user_id, module_id) VALUES ($1, $2)', [id, mId]);
                }
            }

            await client.query('COMMIT');
            res.json({ message: 'User updated successfully' });
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        }
    } catch (error: any) {
        if (error.name === 'ZodError') return res.status(400).json({ errors: error.errors });
        res.status(500).json({ message: error.message || 'Error updating user' });
    }
});

// Reset Password
router.post('/users/:id/reset-password', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 4) return res.status(400).json({ message: 'Invalid password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, id]);

        if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password' });
    }
});

// Get Books for User
router.get('/users/:id/books', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT b.id, b.title, b.category, b.status, b.cover_image,
                   COALESCE(ub.assignment_status, 'inactive') as assignment_status
            FROM books b
            LEFT JOIN user_books ub ON b.id = ub.book_id AND ub.user_id = $1
            ORDER BY b.id ASC
        `;
        const result = await client.query(query, [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching books' });
    }
});

// Toggle Book Status
router.post('/users/:id/books', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { bookId, status } = req.body;
        const query = `
            INSERT INTO user_books (user_id, book_id, assignment_status)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, book_id) DO UPDATE SET assignment_status = $3
        `;
        await client.query(query, [id, bookId, status]);
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating book' });
    }
});


// Get Modules for User
router.get('/users/:id/modules', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT m.id, m.name,
                   CASE WHEN um.user_id IS NOT NULL THEN 'assigned' ELSE 'inactive' END as assignment_status
            FROM modules m
            LEFT JOIN user_modules um ON m.id = um.module_id AND um.user_id = $1
            ORDER BY m.name ASC
        `;
        const result = await client.query(query, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching user modules:', error);
        res.status(500).json({ message: 'Error fetching modules' });
    }
});

// Toggle Module Status
router.post('/users/:id/modules', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { moduleId, status } = req.body; // status: 'assigned' or 'inactive'
        
        if (status === 'assigned') {
            await client.query(`
                INSERT INTO user_modules (user_id, module_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `, [id, moduleId]);
        } else {
            await client.query(`
                DELETE FROM user_modules
                WHERE user_id = $1 AND module_id = $2
            `, [id, moduleId]);
        }
        
        res.json({ message: 'Updated' });
    } catch (error) {
        console.error('Error toggling module:', error);
        res.status(500).json({ message: 'Error updating module' });
    }
});

export default router;

