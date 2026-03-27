
import { Router } from 'express';
import { Client } from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

import client from '../db';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'secret';

// Middleware to verify token
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

// Get Books (User sees assigned, Admin sees all)
router.get('/', authenticateToken, async (req: any, res: any) => {
    try {
        const { role, id } = req.user;

        let query = '';
        let params: any[] = [];

        if (role === 'admin' || role === 'manager') {
            query = 'SELECT * FROM books ORDER BY COALESCE(sort_order, id) ASC';
        } else {
            query = `
                SELECT b.*, ub.assignment_status 
                FROM books b
                JOIN user_books ub ON ub.book_id = b.id
                WHERE ub.user_id = $1 AND ub.assignment_status = 'assigned'
                ORDER BY COALESCE(b.sort_order, b.id) ASC
            `;
            params = [id];
        }

        const result = await client.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reorder Books (Admin/Manager) — accepts [{id, sort_order}] array
router.put('/reorder', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { order } = req.body; // Array of { id: number, sort_order: number }
        if (!Array.isArray(order)) return res.status(400).json({ message: 'Invalid payload' });

        for (const item of order) {
            await client.query('UPDATE books SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
        }

        res.json({ message: 'Order saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Book (Admin/Manager)
router.put('/:id', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { id } = req.params;
        const { title, category, status, description, details, cover_image, rating, reading_time, publisher, isbn, publication_date } = req.body;

        const query = `
            UPDATE books 
            SET title = $1, category = $2, status = $3, description = $4, details = $5, cover_image = $6,
                rating = $7, reading_time = $8, publisher = $9, isbn = $10, publication_date = $11
            WHERE id = $12
        `;
        const params = [title, category, status, description, details, cover_image, rating, reading_time, publisher, isbn, publication_date, id];

        const result = await client.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.json({ message: 'Book updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Book Status (Admin/Manager) - Kept for backward compatibility if needed
router.patch('/:id/status', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.sendStatus(403);

        const { id } = req.params;
        const { status } = req.body;

        await client.query('UPDATE books SET status = $1 WHERE id = $2', [status, id]);
        res.json({ message: 'Book updated' });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Report / KPI Route
router.get('/reports/kpi', authenticateToken, async (req: any, res: any) => {
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
        // We want to see how many users have "completed" vs "in_progress" for each book
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

        // 5. "Apertura" / Engagement (Active Users in last 24h - simulated for now based on login logs)
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

// Get Book TOC
router.get('/:id/contents', authenticateToken, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { role } = req.user;

        let query = '';
        let params: any[] = [id];

        if (role === 'admin' || role === 'manager') {
            // Admins see ALL items
            query = 'SELECT * FROM book_contents WHERE book_id = $1 ORDER BY order_index ASC';
        } else {
            // Users only see active items
            query = 'SELECT * FROM book_contents WHERE book_id = $1 AND is_active = TRUE ORDER BY order_index ASC';
        }

        const result = await client.query(query, params);
        // Ensure parent_id is in result rows if not already by SELECT *
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Manage Book TOC (Admin/Manager)
router.post('/:id/contents', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { id } = req.params;
        const { contents } = req.body; // Array of objects

        // Simple sync strategy: delete and re-insert for now
        await client.query('DELETE FROM book_contents WHERE book_id = $1', [id]);

        if (contents && contents.length > 0) {
            for (let i = 0; i < contents.length; i++) {
                const { title, type, content, page_number } = contents[i];
                await client.query(
                    'INSERT INTO book_contents (book_id, title, type, content, page_number, order_index) VALUES ($1, $2, $3, $4, $5, $6)',
                    [id, title, type, content, page_number, i]
                );
            }
        }

        res.json({ message: 'Contents updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── Individual Content Endpoints (for ContentsManager) ─────────────────────

// Get lightweight TOC metadata (no content field — fast!)
router.get('/:id/contents-meta', authenticateToken, async (req: any, res: any) => {
    try {
        const { id } = req.params;

        const result = await client.query(
            'SELECT id, book_id, title, type, page_number, order_index, parent_id, COALESCE(is_active, TRUE) as is_active, COALESCE(show_in_index, TRUE) as show_in_index FROM book_contents WHERE book_id = $1 ORDER BY order_index ASC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single content item (with full content)
router.get('/:id/contents/:contentId', authenticateToken, async (req: any, res: any) => {
    try {
        const { contentId } = req.params;
        const result = await client.query(
            'SELECT * FROM book_contents WHERE id = $1',
            [contentId]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Content not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add single content item
router.post('/:id/contents/add', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { id } = req.params;
        const { title, type, content, page_number } = req.body;

        // Get the next order_index
        const maxOrder = await client.query(
            'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM book_contents WHERE book_id = $1',
            [id]
        );
        const orderIndex = maxOrder.rows[0].next_order;

        const result = await client.query(
            'INSERT INTO book_contents (book_id, title, type, content, page_number, order_index) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, title || '', type || 'topic', content || '', page_number || '', orderIndex]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update single content item
router.put('/:id/contents/:contentId', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { contentId } = req.params;
        const { title, type, content, page_number, order_index } = req.body;

        // Build dynamic update query based on provided fields
        const updates: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title); }
        if (type !== undefined) { updates.push(`type = $${idx++}`); values.push(type); }
        if (content !== undefined) { updates.push(`content = $${idx++}`); values.push(content); }
        if (page_number !== undefined) { updates.push(`page_number = $${idx++}`); values.push(page_number); }
        if (order_index !== undefined) { updates.push(`order_index = $${idx++}`); values.push(order_index); }
        if (req.body.is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(req.body.is_active); }
        if (req.body.show_in_index !== undefined) { updates.push(`show_in_index = $${idx++}`); values.push(req.body.show_in_index); }

        if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });

        values.push(contentId);
        const result = await client.query(
            `UPDATE book_contents SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, title, type, page_number, order_index`,
            values
        );

        if (result.rowCount === 0) return res.status(404).json({ message: 'Content not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete single content item
router.delete('/:id/contents/:contentId', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { contentId } = req.params;
        const result = await client.query('DELETE FROM book_contents WHERE id = $1', [contentId]);

        if (result.rowCount === 0) return res.status(404).json({ message: 'Content not found' });
        res.json({ message: 'Content deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete multiple content items (Batch Delete)
router.post('/:id/contents-batch-delete', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Invalid payload: empty or non-array ids' });
        }

        const result = await client.query(
            'DELETE FROM book_contents WHERE id = ANY($1::int[])',
            [ids]
        );

        res.json({ message: 'Contents deleted', count: result.rowCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reorder contents
router.put('/:id/contents-reorder', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { order } = req.body; // Array of { id: number, order_index: number, parent_id: number | null }
        if (!Array.isArray(order)) return res.status(400).json({ message: 'Invalid payload' });

        for (const item of order) {
            await client.query(
                'UPDATE book_contents SET order_index = $1, parent_id = $2 WHERE id = $3', 
                [item.order_index, item.parent_id !== undefined ? item.parent_id : null, item.id]
            );
        }

        res.json({ message: 'Contents reordered' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle is_active for a content item (Admin/Manager)
router.patch('/:id/contents/:contentId/toggle', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { contentId } = req.params;
        const result = await client.query(
            'UPDATE book_contents SET is_active = NOT COALESCE(is_active, TRUE) WHERE id = $1 RETURNING id, is_active',
            [contentId]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Content not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Batch Toggle is_active (Admin/Manager)
router.post('/:id/contents-batch-toggle-active', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { ids, is_active } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Invalid payload' });

        const result = await client.query(
            'UPDATE book_contents SET is_active = $1 WHERE id = ANY($2::int[])',
            [is_active, ids]
        );

        res.json({ message: 'Contents updated', count: result.rowCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle show_in_index for a content item (Admin/Manager)
router.patch('/:id/contents/:contentId/toggle-index', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { contentId } = req.params;
        const result = await client.query(
            'UPDATE book_contents SET show_in_index = NOT COALESCE(show_in_index, TRUE) WHERE id = $1 RETURNING id, show_in_index',
            [contentId]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Content not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Batch Toggle show_in_index (Admin/Manager)
router.post('/:id/contents-batch-toggle-index', authenticateToken, async (req: any, res: any) => {
    try {
        const { role } = req.user;
        if (role !== 'admin' && role !== 'manager') return res.status(403).json({ message: 'Forbidden' });

        const { ids, show_in_index } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Invalid payload' });

        const result = await client.query(
            'UPDATE book_contents SET show_in_index = $1 WHERE id = ANY($2::int[])',
            [show_in_index, ids]
        );

        res.json({ message: 'Contents updated', count: result.rowCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
