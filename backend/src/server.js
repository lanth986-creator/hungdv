import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { testConnection } from './config/database.js';
import pool from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { deleteExpiredSessions } from './models/AuthSession.js';
import { ensureDefaultAdmin } from './models/User.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_DIST = join(__dirname, '..', '..', 'frontend', 'dist');

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/uploads', requireAuth, express.static(join(__dirname, '..', 'uploads')));
app.use('/api/categories', requireAuth, categoryRoutes);
app.use('/api/documents', requireAuth, documentRoutes);
app.use('/api/tasks', requireAuth, taskRoutes);

if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(join(CLIENT_DIST, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const initDB = async () => {
  try {
    const sql = readFileSync(join(__dirname, 'config', 'init.sql'), 'utf-8');
    await pool.query(sql);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Database init failed:', err.message);
  }
};

const start = async () => {
  await testConnection();
  await initDB();
  await ensureDefaultAdmin();
  await deleteExpiredSessions();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();
