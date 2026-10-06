import { prisma } from '../prisma.js';
import { analyzeStudentSkills } from '../services/aiService.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's tasks
    const todayTasks = await prisma.userTask.findMany({
      where: { userId, assignedDate: { gte: today, lt: tomorrow } },
      include: { task: true },
    });

    const completedToday = todayTasks.filter(t => t.status === 'COMPLETED').length;

    // Recent tests
    const recentTests = await prisma.test.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Recent interviews
    const recentInterviews = await prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Total stats
    const totalTasksCompleted = await prisma.userTask.count({ where: { userId, status: 'COMPLETED' } });
    const totalTests = await prisma.test.count({ where: { userId } });
    const totalInterviews = await prisma.interview.count({ where: { userId } });

    // Latest assessment
    const latestAssessment = await prisma.assessment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Streak calculation
    let streak = 0;
    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);

    while (streak < 365) {
      const nextDay = new Date(checkDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const dayTasks = await prisma.userTask.findMany({
        where: { userId, assignedDate: { gte: checkDate, lt: nextDay } },
      });
      if (dayTasks.length > 0 && dayTasks.every(t => t.status === 'COMPLETED')) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // If today completed too
    if (todayTasks.length > 0 && todayTasks.every(t => t.status === 'COMPLETED')) streak++;

    // Weekly progress (last 7 days)
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayTasks = await prisma.userTask.count({
        where: { userId, assignedDate: { gte: d, lt: nextD }, status: 'COMPLETED' },
      });
      weeklyProgress.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: dayTasks,
      });
    }

    res.json({
      todayTasks: { total: todayTasks.length, completed: completedToday, tasks: todayTasks },
      streak,
      totalTasksCompleted,
      totalTests,
      totalInterviews,
      latestAssessment,
      recentTests,
      recentInterviews,
      weeklyProgress,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const tests = await prisma.test.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const interviews = await prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const tasks = await prisma.userTask.findMany({
      where: { userId },
      include: { task: true },
    });

    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Run AI analysis
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    const aiAnalysis = analyzeStudentSkills(profile, assessments, tests, tasks, interviews);

    // Topic-wise analysis from tests
    const topicAnalysis = {};
    tests.forEach(test => {
      const answers = test.answers || [];
      if (Array.isArray(answers)) {
        answers.forEach(a => {
          if (!topicAnalysis[a.topic]) topicAnalysis[a.topic] = { correct: 0, total: 0 };
          topicAnalysis[a.topic].total++;
          if (a.isCorrect) topicAnalysis[a.topic].correct++;
        });
      }
    });

    const topicScores = Object.entries(topicAnalysis).map(([topic, data]) => ({
      topic,
      score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      attempted: data.total,
    }));

    // Test score trend
    const testTrend = tests.map(t => ({
      date: new Date(t.createdAt).toLocaleDateString(),
      score: t.score,
    }));

    // Interview score trend
    const interviewTrend = interviews.map(i => ({
      date: new Date(i.createdAt).toLocaleDateString(),
      score: i.score,
      type: i.type,
    }));

    // Task completion by type
    const tasksByType = {};
    tasks.forEach(ut => {
      const type = ut.task.type;
      if (!tasksByType[type]) tasksByType[type] = { completed: 0, total: 0 };
      tasksByType[type].total++;
      if (ut.status === 'COMPLETED') tasksByType[type].completed++;
    });

    // Strengths and weaknesses
    const strengths = topicScores.filter(t => t.score >= 70).map(t => t.topic);
    const weaknesses = topicScores.filter(t => t.score < 50).map(t => t.topic);

    // AI suggestions
    const suggestions = [];
    if (weaknesses.length > 0) suggestions.push(`Focus on improving: ${weaknesses.join(', ')}`);
    if (tests.length < 3) suggestions.push('Take more weekly tests to track your progress');
    if (interviews.length < 2) suggestions.push('Practice mock interviews regularly');

    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    if (completionRate < 70) suggestions.push('Try to complete at least 70% of your daily tasks');
    if (suggestions.length === 0) suggestions.push('Excellent progress! Keep up the consistency!');

    res.json({
      topicScores,
      testTrend,
      interviewTrend,
      tasksByType,
      strengths,
      weaknesses,
      suggestions: aiAnalysis.recommendations.map(r => r.message),
      aiAnalysis,
      overallStats: {
        totalTasks: tasks.length,
        completedTasks,
        completionRate,
        avgTestScore: tests.length > 0 ? Math.round(tests.reduce((s, t) => s + t.score, 0) / tests.length) : 0,
        avgInterviewScore: interviews.length > 0 ? Math.round(interviews.reduce((s, i) => s + i.score, 0) / interviews.length) : 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
};
