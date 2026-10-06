import { prisma } from '../prisma.js';
import { generateStudyPlan } from '../services/aiService.js';

// Removed hardcoded questions. Logic now pulls from DB.
const getRandomItems = (arr, n) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

export const getQuestions = async (req, res) => {
  try {
    // 1. Fetch 5 Aptitude MCQs
    const aptitudePool = await prisma.mCQQuestion.findMany({
      where: {
        category: { in: ['Verbal and Reasoning', 'Puzzles', 'General', 'Interview'] },
        isActive: true
      }
    });
    const aptitude = getRandomItems(aptitudePool, 5);

    // 2. Fetch 10 Technical MCQs
    const technicalPool = await prisma.mCQQuestion.findMany({
      where: {
        category: { in: ['Technical MCQs', 'DSA'] },
        isActive: true
      }
    });
    const technical = getRandomItems(technicalPool, 10);

    // 3. Fetch 3 Coding Problems
    const codingPool = await prisma.codingProblem.findMany({
      where: { isActive: true }
    });
    const coding = getRandomItems(codingPool, 2);

    res.json({ aptitude, technical, coding });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assessment questions.' });
  }
};

export const submitAssessment = async (req, res) => {
  try {
    const { answers, proctor_data } = req.body;
    let aptitudeScore = 0, technicalScore = 0, codingScore = 0;

    // 1. Get all submitted question IDs
    const submittedIds = Object.keys(answers).filter(k => k.match(/^\d+$/)).map(Number);
    
    // 2. Fetch these questions from the database to check correct answers
    const questions = await prisma.mCQQuestion.findMany({
      where: { id: { in: submittedIds } }
    });

    // 3. Score aptitude and technical
    questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer === q.correct) {
        if (['Verbal and Reasoning', 'Puzzles', 'General', 'Interview'].includes(q.category)) {
          aptitudeScore += 20; // 5 questions * 20 = 100
        } else {
          technicalScore += 10; // 10 questions * 10 = 100
        }
      }
    });

    // 4. Score coding (from the body or answers)
    codingScore = req.body.coding_score !== undefined ? req.body.coding_score : (answers.coding_score || 0);
    codingScore = Math.min(codingScore, 100);

    const totalScore = (aptitudeScore * 0.25 + technicalScore * 0.5 + codingScore * 0.25);

    // 5. Merge proctoring data into stored answers
    const storedAnswers = {
      ...answers,
      _proctor: proctor_data || { violationCount: 0, level: 'safe', violations: [] }
    };

    const assessment = await prisma.assessment.create({
      data: {
        userId: req.user.id,
        score: Math.round(totalScore),
        maxScore: 100,
        aptitude: Math.min(aptitudeScore, 100),
        technical: Math.min(technicalScore, 100),
        coding: codingScore,
        answers: storedAnswers,
      },
    });

    // Generate a study plan based on assessment
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (profile) {
      const plan = generateStudyPlan(profile, assessment);
      await prisma.studyPlan.create({
        data: { userId: req.user.id, plan: plan },
      });
    }

    res.json({ assessment, message: 'Assessment submitted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit assessment.' });
  }
};

export const getAssessments = async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assessments.' });
  }
};
