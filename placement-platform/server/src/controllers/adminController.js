import { prisma } from '../prisma.js';

export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalStudents, totalTasks, totalTests, totalInterviews, totalOpportunities, totalProblems, totalMCQs] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.task.count(),
      prisma.test.count(),
      prisma.interview.count(),
      prisma.opportunity.count(),
      prisma.codingProblem.count({ where: { isActive: true } }),
      prisma.mCQQuestion.count({ where: { isActive: true } }),
    ]);

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.json({ totalUsers, totalStudents, totalTasks, totalTests, totalInterviews, totalOpportunities, totalProblems, totalMCQs, recentUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role.' });
  }
};

// ========== Coding Problem Management ==========
export const createCodingProblem = async (req, res) => {
  try {
    const problem = await prisma.codingProblem.create({ data: req.body });
    res.status(201).json(problem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create problem.' });
  }
};

export const updateCodingProblem = async (req, res) => {
  try {
    const problem = await prisma.codingProblem.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(problem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update problem.' });
  }
};

export const deleteCodingProblem = async (req, res) => {
  try {
    await prisma.codingProblem.update({ where: { id: parseInt(req.params.id) }, data: { isActive: false } });
    res.json({ message: 'Problem deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete problem.' });
  }
};

export const getAllCodingProblems = async (req, res) => {
  try {
    const problems = await prisma.codingProblem.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    res.json(problems);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch problems.' });
  }
};

// ========== MCQ Question Management ==========
export const createMCQ = async (req, res) => {
  try {
    const mcq = await prisma.mCQQuestion.create({ data: req.body });
    res.status(201).json(mcq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create MCQ.' });
  }
};

export const updateMCQ = async (req, res) => {
  try {
    const mcq = await prisma.mCQQuestion.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(mcq);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update MCQ.' });
  }
};

export const deleteMCQ = async (req, res) => {
  try {
    await prisma.mCQQuestion.update({ where: { id: parseInt(req.params.id) }, data: { isActive: false } });
    res.json({ message: 'MCQ deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete MCQ.' });
  }
};

export const getAllMCQs = async (req, res) => {
  try {
    const mcqs = await prisma.mCQQuestion.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    res.json(mcqs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch MCQs.' });
  }
};
