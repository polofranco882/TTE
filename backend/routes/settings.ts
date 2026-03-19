
import { Router } from 'express';
import client from '../db';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';

const router = Router();

// Get all settings
router.get('/', async (req, res) => {
    try {
        const result = await client.query('SELECT key, value FROM app.settings');
        const settings: { [key: string]: string } = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// Update specific settings
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
    const { settings } = req.body; // Expecting an object { key1: value1, key2: value2 }

    try {
        await client.query('BEGIN');
        for (const [key, value] of Object.entries(settings)) {
            await client.query(`
                INSERT INTO app.settings (key, value, updated_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP;
            `, [key, value]);
        }
        await client.query('COMMIT');
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
});

export default router;
