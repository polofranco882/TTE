
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

import client from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'secret';

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    try {
        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            console.log(`LOGIN FAILED: User not found for email [${email}]`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`LOGIN: User found for [${email}]. Comparing passwords...`);
        const valid = await bcrypt.compare(password, user.password_hash);
        
        if (!valid) {
            console.log(`LOGIN FAILED: Password mismatch for [${email}]. DB Hash starts with: ${user.password_hash.substring(0, 10)}...`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        console.log(`LOGIN SUCCESS: [${email}]`);

        // Get Role
        const roleRes = await client.query(`
            SELECT r.name FROM roles r
            JOIN user_roles ur ON ur.role_id = r.id
            WHERE ur.user_id = $1
        `, [user.id]);

        const role = roleRes.rows[0]?.name || 'user';

        // Sign Token
        const token = jwt.sign({ id: user.id, email: user.email, role }, SECRET, { expiresIn: '24h' });

        // Log Activity
        await client.query(`
            INSERT INTO activity_log (user_id, action, module, details, ip, user_agent)
            VALUES ($1, 'LOGIN', 'AUTH', 'User logged in', $2, $3)
        `, [user.id, req.ip, req.headers['user-agent']]);

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Activity Logging Route
router.post('/log', authenticateToken, async (req: AuthRequest, res) => {
    const { action, metadata } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'User identity lost' });

    try {
        await client.query(`
            INSERT INTO activity_log (user_id, action, module, details, ip, user_agent)
            VALUES ($1, $2, 'APP', $3, $4, $5)
        `, [
            userId, 
            action, 
            metadata ? JSON.stringify(metadata) : 'No details provided', 
            req.ip, 
            req.headers['user-agent']
        ]);
        
        res.status(204).send(); // No content success
    } catch (error) {
        console.error('Logger error:', error);
        res.status(500).json({ message: 'Failed to log event' });
    }
});

export default router;
