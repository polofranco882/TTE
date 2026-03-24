
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Database connection import (side effect connects)
import './db';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false, // Disable for easier debugging in dev/prod transition if needed
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Health Check / Root
app.get('/', (req, res) => {
    res.json({ message: 'TTE Backend is running', timestamp: new Date() });
});

// Explicit API Root
app.get('/api', (req, res) => {
    res.json({ message: 'TTE API v1 is active' });
});

// Routes - Explicitly using /api prefix to match app.yaml with preserve_path_prefix: true
import authRoutes from './routes/auth';
import bookRoutes from './routes/books';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';
import settingsRoutes from './routes/settings';
import landingRoutes from './routes/landing';
import landingModulesRoutes from './routes/landing-modules';
import mediaRoutes from './routes/media';
import i18nRoutes from './routes/i18n';

app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/reports', reportRoutes);
app.use('/admin', adminRoutes);
app.use('/ai', aiRoutes);
app.use('/settings', settingsRoutes);
app.use('/landing', landingRoutes);
app.use('/landing-modules', landingModulesRoutes);
app.use('/media', mediaRoutes);
app.use('/i18n', i18nRoutes);

// Protected Route Example
app.get('/protected', (req, res) => {
    res.json({ message: 'This is protected' });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
