import { prisma } from '../prisma.js';

export const generateReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body; // weekly or monthly

    // Gather data
    const now = new Date();
    const startDate = new Date(now);
    if (type === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    const tasks = await prisma.userTask.findMany({
      where: { userId, assignedDate: { gte: startDate } },
      include: { task: true },
    });

    const tests = await prisma.test.findMany({
      where: { userId, createdAt: { gte: startDate } },
    });

    const interviews = await prisma.interview.findMany({
      where: { userId, createdAt: { gte: startDate } },
    });

    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const totalTasks = tasks.length;
    const avgTestScore = tests.length > 0 ? tests.reduce((s, t) => s + t.score, 0) / tests.length : 0;
    const avgInterviewScore = interviews.length > 0 ? interviews.reduce((s, i) => s + i.score, 0) / interviews.length : 0;

    // Determine strengths and weaknesses
    const topicScores = {};
    tests.forEach(test => {
      const answers = test.answers || [];
      if (Array.isArray(answers)) {
        answers.forEach(a => {
          if (!topicScores[a.topic]) topicScores[a.topic] = { correct: 0, total: 0 };
          topicScores[a.topic].total++;
          if (a.isCorrect) topicScores[a.topic].correct++;
        });
      }
    });

    const strengths = [];
    const weaknesses = [];
    Object.entries(topicScores).forEach(([topic, data]) => {
      const pct = data.total > 0 ? (data.correct / data.total) * 100 : 0;
      if (pct >= 70) strengths.push(topic);
      else weaknesses.push(topic);
    });

    const recommendations = [];
    if (completedTasks / Math.max(totalTasks, 1) < 0.7) recommendations.push('Improve daily task completion rate');
    if (avgTestScore < 60) recommendations.push('Focus more on test preparation and concept revision');
    if (avgInterviewScore < 60) recommendations.push('Practice more mock interviews');
    weaknesses.forEach(w => recommendations.push(`Strengthen your knowledge in ${w}`));
    if (recommendations.length === 0) recommendations.push('Great progress! Keep maintaining consistency');

    const reportData = {
      period: type,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      tasks: { completed: completedTasks, total: totalTasks, rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0 },
      tests: { count: tests.length, avgScore: Math.round(avgTestScore), scores: tests.map(t => ({ score: t.score, date: t.createdAt })) },
      interviews: { count: interviews.length, avgScore: Math.round(avgInterviewScore) },
      strengths,
      weaknesses,
      recommendations,
    };

    const report = await prisma.report.create({
      data: { userId, title: `${type === 'monthly' ? 'Monthly' : 'Weekly'} Report`, type, data: reportData },
    });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.user.id },
      orderBy: { generatedAt: 'desc' },
      take: 20,
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
};
