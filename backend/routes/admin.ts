
import { Router } from 'express';
import client from '../db';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const router = Router();
const SECRET = process.env.JWT_SECRET || 'secret';

// Middleware to verify token and admin/manager role
const authenticateAdmin = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);

        if (user.role !== 'admin') {
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
};

// Get All Users
router.get('/users', authenticateAdmin, async (req: any, res: any) => {
    try {
        const result = await client.query('SELECT id, name, email, status, created_at FROM app.users ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching app.users' });
    }
});

// Get Books for Specific User (with status)
router.get('/app.users/:id/app.books', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;

        // Return all app.books, and map the assignment status for this user
        // We do a LEFT JOIN on app.user_books for this specific user_id
        const query = `
            SELECT b.id, b.title, b.category, b.status, b.metadata,
                   b.metadata->>'cover_image' as cover_image,
                   COALESCE(ub.assignment_status, 'inactive') as assignment_status
            FROM app.books b
            LEFT JOIN app.user_books ub ON b.id = ub.book_id AND ub.user_id = $1
            ORDER BY b.id ASC
        `;

        const result = await client.query(query, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching user app.books' });
    }
});

// Toggle Book Status for User
router.post('/app.users/:id/app.books', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params; // user_id
        const { bookId, status } = req.body; // status: 'assigned' | 'inactive'

        if (!bookId || !status) {
            return res.status(400).json({ message: 'Missing bookId or status' });
        }

        // Upsert logic: Insert or Update
        const query = `
            INSERT INTO app.user_books (user_id, book_id, assignment_status)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, book_id) 
            DO UPDATE SET assignment_status = $3
        `;

        await client.query(query, [id, bookId, status]);

        res.json({ message: 'Book status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating book status' });
    }
});

// Reset Password for a User (Admin only)
router.post('/app.users/:id/reset-password', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ message: 'Password must be at least 4 characters' });
        }

        // Hash the new password
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        const result = await client.query(
            'UPDATE app.users SET password_hash = $1 WHERE id = $2 RETURNING id, name, email',
            [hashedPassword, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Password reset successfully', user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error resetting password' });
    }
});

// Create New User (Admin only)
router.post('/app.users/create', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 4) {
            return res.status(400).json({ message: 'Password must be at least 4 characters' });
        }

        // Check if user already exists
        const userExists = await client.query('SELECT id FROM app.users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash the password
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Begin transaction
        await client.query('BEGIN');

        try {
            // Insert User
            const insertUserQuery = `
                INSERT INTO app.users (name, email, password_hash)
                VALUES ($1, $2, $3)
                RETURNING id, name, email, status, created_at
            `;
            const userResult = await client.query(insertUserQuery, [name, email, hashedPassword]);
            const newUser = userResult.rows[0];

            // Get Role ID
            const roleResult = await client.query('SELECT id FROM app.roles WHERE name = $1', [role]);
            if (roleResult.rows.length === 0) {
                throw new Error(`Role '${role}' not found in database`);
            }
            const roleId = roleResult.rows[0].id;

            // Assign Role
            await client.query('INSERT INTO app.user_roles (user_id, role_id) VALUES ($1, $2)', [newUser.id, roleId]);

            await client.query('COMMIT');

            res.status(201).json({ message: 'User created successfully', user: newUser });
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        }

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error creating user' });
    }
});

export default router;
