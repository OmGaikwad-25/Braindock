const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const [userCount, probCount, mcqCount, taskCount] = await Promise.all([
      prisma.user.count(),
      prisma.codingProblem.count(),
      prisma.mCQQuestion.count(),
      prisma.task.count()
    ]);
    console.log('--- Database Stats ---');
    console.log('Users:', userCount);
    console.log('CodingProblems:', probCount);
    console.log('MCQQuestions:', mcqCount);
    console.log('Tasks:', taskCount);

    if (probCount > 0) {
      console.log('\n--- Coding Problems (First 5) ---');
      const probs = await prisma.codingProblem.findMany({ take: 5 });
      probs.forEach(p => console.log(`[${p.id}] ${p.title} - Active: ${p.isActive}`));
    }

    if (mcqCount > 0) {
      console.log('\n--- MCQ Questions (First 5) ---');
      const mcqs = await prisma.mCQQuestion.findMany({ take: 5 });
      mcqs.forEach(m => console.log(`[${m.id}] ${m.question.substring(0,30)}...`));
    }

    if (taskCount > 0) {
      console.log('\n--- Tasks (First 5) ---');
      const tasks = await prisma.task.findMany({ take: 5 });
      tasks.forEach(t => console.log(`[${t.id}] ${t.title} - Type: ${t.type}`));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
