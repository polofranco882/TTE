
import { Router } from 'express';
import bcrypt from 'bcrypt';
import client from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /me - Fetch current user profile
router.get('/me', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const result = await client.query(`
            SELECT 
                id, name, email, status, created_at,
                phone_number, birthdate, country, city, 
                preferred_language, timezone, photo_url,
                notification_prefs, visibility_settings
            FROM users 
            WHERE id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// PUT /me - Update current user profile
router.post('/me', authenticateToken, async (req: any, res) => {
    const userId = req.user.id;
    const { 
        name, phone_number, birthdate, country, city, 
        preferred_language, timezone, photo_url,
        notification_prefs, visibility_settings 
    } = req.body;

    try {
        await client.query(`
            UPDATE users SET
                name = COALESCE($1, name),
                phone_number = COALESCE($2, phone_number),
                birthdate = COALESCE($3, birthdate),
                country = COALESCE($4, country),
                city = COALESCE($5, city),
                preferred_language = COALESCE($6, preferred_language),
                timezone = COALESCE($7, timezone),
                photo_url = COALESCE($8, photo_url),
                notification_prefs = COALESCE($9, notification_prefs),
                visibility_settings = COALESCE($10, visibility_settings)
            WHERE id = $11
        `, [
            name, phone_number, birthdate, country, city, 
            preferred_language, timezone, photo_url,
            notification_prefs, visibility_settings,
            userId
        ]);

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// POST /password - Change password
router.post('/password', authenticateToken, async (req: any, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    try {
        // Fetch current hash
        const result = await client.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const valid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!valid) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        // Hash new password
        const saltRounds = 10;
        const newHash = await bcrypt.hash(newPassword, saltRounds);

        // Update
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Error changing password' });
    }
});

export default router;
