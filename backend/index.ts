
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Client } from 'pg';

// Database connection import (side effect connects)
import './db';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.get('/', (req, res) => {
    res.json({ message: 'Book Portal API is running' });
});

// Routes
const authRoutes = require('./routes/auth').default || require('./routes/auth');
const bookRoutes = require('./routes/books').default || require('./routes/books');
const reportRoutes = require('./routes/reports').default || require('./routes/reports');
const adminRoutes = require('./routes/admin').default || require('./routes/admin');
const aiRoutes = require('./routes/ai').default || require('./routes/ai');

app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/reports', reportRoutes);
app.use('/admin', adminRoutes);
app.use('/ai', aiRoutes);

// Protected Route Example
app.get('/protected', (req, res) => {
    res.json({ message: 'This is protected' });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
