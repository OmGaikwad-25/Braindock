import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import testRoutes from './routes/testRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import codingRoutes from './routes/codingRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import aptitudeRoutes from './routes/aptitudeRoutes.js';
import { seedMockData } from './services/seederService.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/aptitude', aptitudeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await seedMockData();
});
