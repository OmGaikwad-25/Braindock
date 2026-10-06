// Enhanced AI Service - Skill analysis, personalized plans, interview evaluation

export function generateStudyPlan(profile, assessment) {
  const plan = [];
  const skills = profile?.skills || [];
  const weakAreas = [];

  if (assessment.aptitude < 60) weakAreas.push('Aptitude');
  if (assessment.technical < 60) weakAreas.push('Technical Fundamentals');
  if (assessment.coding < 60) weakAreas.push('Coding Skills');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  days.forEach((day, i) => {
    const dayPlan = { day, tasks: [] };

    dayPlan.tasks.push({
      type: 'CODING',
      title: `Solve 2 ${i < 3 ? 'Easy' : i < 5 ? 'Medium' : 'Hard'} DSA Problems`,
      topic: ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'DP', 'Stack/Queue'][i],
      duration: '60 min',
      difficulty: i < 3 ? 'EASY' : i < 5 ? 'MEDIUM' : 'HARD',
    });

    if (i % 2 === 0) {
      dayPlan.tasks.push({
        type: 'MCQ',
        title: 'Practice 15 MCQs',
        topic: ['DBMS', 'OS', 'CN', 'OOP'][Math.floor(i / 2) % 4],
        duration: '30 min',
        difficulty: 'MEDIUM',
      });
    }

    if (weakAreas.length > 0) {
      dayPlan.tasks.push({
        type: 'LEARNING',
        title: `Study ${weakAreas[i % weakAreas.length]}`,
        topic: weakAreas[i % weakAreas.length],
        duration: '45 min',
        difficulty: 'EASY',
      });
    }

    if (i === 5) dayPlan.tasks.push({ type: 'PRACTICE', title: 'Mock Test - Full Length', topic: 'All Topics', duration: '90 min', difficulty: 'MEDIUM' });
    if (i === 6) dayPlan.tasks.push({ type: 'PRACTICE', title: 'Mock Interview Practice', topic: 'Interview Prep', duration: '60 min', difficulty: 'MEDIUM' });

    plan.push(dayPlan);
  });

  return plan;
}

export function generateInterviewQuestions(type, profile) {
  const technicalQuestions = [
    "Explain the difference between a process and a thread. When would you use one over the other?",
    "What is the time complexity of common sorting algorithms? When would you choose QuickSort over MergeSort?",
    "Explain how a hash table works internally. How do you handle collisions?",
    "What are ACID properties in databases? Give a real-world example of each.",
    "Explain the concept of virtual memory. Why is it important in modern operating systems?",
    "What is the difference between TCP and UDP? When would you use each?",
    "Explain polymorphism in OOP with a practical example.",
    "Design a URL shortener system. What components would you need?",
    "How does garbage collection work in languages like Java or Python?",
    "What is the CAP theorem? Explain with examples of distributed systems.",
  ];

  const hrQuestions = [
    "Tell me about yourself and your career aspirations.",
    "Describe a challenging project you worked on. What was your role and the outcome?",
    "How do you handle tight deadlines and pressure?",
    "What are your strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Why do you want to work at our company?",
    "Describe a situation where you had to work in a team with conflicting opinions.",
    "How do you stay updated with the latest technology trends?",
    "Tell me about a time you failed and what you learned from it.",
    "What questions do you have for us?",
  ];

  const systemDesignQuestions = [
    "Design a chat application like WhatsApp. What architecture would you use?",
    "How would you design a notification system for a large-scale application?",
    "Design a social media news feed. How would you handle millions of users?",
    "How would you design a file storage service like Google Drive?",
    "Design a rate limiter for an API. What algorithms would you consider?",
  ];

  let questions;
  switch (type) {
    case 'HR': questions = hrQuestions; break;
    case 'SYSTEM_DESIGN': questions = systemDesignQuestions; break;
    default: questions = technicalQuestions;
  }

  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}

export function evaluateInterviewAnswer(type, answer, questionIndex) {
  if (!answer || answer.trim().length === 0) {
    return { score: 0, feedback: "No answer provided. Please provide a detailed response.", details: { clarity: 0, depth: 0, relevance: 0, communication: 0 } };
  }

  const wordCount = answer.trim().split(/\s+/).length;
  const lowerAnswer = answer.toLowerCase();
  let score = 0;
  const details = { clarity: 0, depth: 0, relevance: 0, communication: 0 };

  // Length/detail scoring
  if (wordCount >= 100) { score += 25; details.depth = 80; }
  else if (wordCount >= 50) { score += 15; details.depth = 60; }
  else if (wordCount >= 20) { score += 8; details.depth = 40; }
  else { score += 3; details.depth = 20; }

  // Technical keywords
  const techKeywords = ['algorithm', 'complexity', 'data structure', 'database', 'system', 'design', 'scalab', 'efficien', 'implement', 'approach', 'solution', 'optimize', 'example', 'because', 'therefore', 'however', 'consider', 'trade-off', 'advantage', 'disadvantage', 'performance', 'memory', 'time', 'space', 'architecture', 'pattern', 'principle', 'abstraction', 'encapsulation', 'inheritance'];
  let keywordMatches = 0;
  techKeywords.forEach(kw => { if (lowerAnswer.includes(kw)) keywordMatches++; });
  score += Math.min(keywordMatches * 4, 30);
  details.relevance = Math.min(keywordMatches * 10, 90);

  // Structure analysis
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length >= 4) { score += 10; details.clarity = 80; }
  else if (sentences.length >= 2) { score += 5; details.clarity = 60; }
  else { details.clarity = 30; }

  // Examples bonus
  if (lowerAnswer.includes('for example') || lowerAnswer.includes('such as') || lowerAnswer.includes('instance') || lowerAnswer.includes('like ')) {
    score += 10; details.depth = Math.min(details.depth + 15, 100);
  }

  // Communication quality (fluency markers)
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally'];
  let fillerCount = 0;
  fillerWords.forEach(f => { if (lowerAnswer.includes(f)) fillerCount++; });
  details.communication = Math.max(90 - fillerCount * 15, 20);
  score += details.communication > 60 ? 10 : 0;

  // Confidence markers
  if (lowerAnswer.includes('i believe') || lowerAnswer.includes('in my experience') || lowerAnswer.includes('i have worked') || lowerAnswer.includes('i would')) {
    score += 10; details.communication = Math.min(details.communication + 10, 100);
  }

  // Comparison/trade-off bonus
  if (lowerAnswer.includes('compared to') || lowerAnswer.includes('on the other hand') || lowerAnswer.includes('trade-off') || lowerAnswer.includes('versus') || lowerAnswer.includes('pros and cons')) {
    score += 5; details.depth = Math.min(details.depth + 10, 100);
  }

  score = Math.min(score, 100);

  let feedback = '';
  if (score >= 80) {
    feedback = "✅ Excellent answer! You demonstrated strong understanding with clear examples, good structure, and confident communication.";
  } else if (score >= 60) {
    feedback = "👍 Good answer. You covered the key points well. Try adding more specific examples and discussing trade-offs to strengthen your response.";
  } else if (score >= 40) {
    feedback = "⚠️ Decent attempt, but your answer could be more comprehensive. Include specific examples, explain trade-offs, and structure your response with clear points.";
  } else {
    feedback = "❌ Your answer needs more depth. Make sure to explain concepts clearly, provide concrete examples, and demonstrate your understanding of the topic.";
  }

  feedback += `\n\n📊 Breakdown: Clarity ${details.clarity}% | Depth ${details.depth}% | Relevance ${details.relevance}% | Communication ${details.communication}%`;

  return { score, feedback, details };
}

// ========== Enhanced AI Skill Analysis ==========
export function analyzeStudentSkills(profile, assessments, tests, tasks, interviews) {
  const analysis = {
    overallScore: 0,
    skillScores: {},
    strengths: [],
    weaknesses: [],
    recommendations: [],
    learningVelocity: 'steady',
    readinessLevel: 'beginner',
    personalizedPlan: [],
  };

  // Aggregate topic scores from tests
  const topicData = {};
  tests.forEach(test => {
    const answers = test.answers || [];
    if (Array.isArray(answers)) {
      answers.forEach(a => {
        if (!topicData[a.topic]) topicData[a.topic] = { correct: 0, total: 0, trend: [] };
        topicData[a.topic].total++;
        if (a.isCorrect) topicData[a.topic].correct++;
      });
    }
  });

  // Calculate skill scores
  const coreSkills = ['DSA', 'Trees', 'Graphs', 'Sorting', 'Hashing', 'DBMS', 'OS', 'Networks', 'OOP', 'Web', 'DP', 'Design Patterns', 'JavaScript'];
  coreSkills.forEach(skill => {
    const data = topicData[skill];
    if (data && data.total > 0) {
      analysis.skillScores[skill] = Math.round((data.correct / data.total) * 100);
    }
  });

  // Assessment scores
  if (assessments.length > 0) {
    const latest = assessments[0];
    analysis.skillScores['Aptitude'] = latest.aptitude;
    analysis.skillScores['Technical'] = latest.technical;
    analysis.skillScores['Coding'] = Math.round(latest.coding);
  }

  // Interview performance
  if (interviews.length > 0) {
    const avgInterview = Math.round(interviews.reduce((s, i) => s + i.score, 0) / interviews.length);
    analysis.skillScores['Interview Skills'] = avgInterview;
  }

  // Task completion rate
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  analysis.skillScores['Consistency'] = taskCompletionRate;

  // Identify strengths and weaknesses
  Object.entries(analysis.skillScores).forEach(([skill, score]) => {
    if (score >= 70) analysis.strengths.push({ skill, score });
    else if (score < 50) analysis.weaknesses.push({ skill, score });
  });
  analysis.strengths.sort((a, b) => b.score - a.score);
  analysis.weaknesses.sort((a, b) => a.score - b.score);

  // Overall score
  const scores = Object.values(analysis.skillScores);
  analysis.overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Learning velocity
  if (tests.length >= 3) {
    const recentScores = tests.slice(0, 3).map(t => t.score);
    const olderScores = tests.slice(-3).map(t => t.score);
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
    if (recentAvg > olderAvg + 10) analysis.learningVelocity = 'accelerating';
    else if (recentAvg < olderAvg - 10) analysis.learningVelocity = 'declining';
  }

  // Readiness level
  if (analysis.overallScore >= 80) analysis.readinessLevel = 'placement-ready';
  else if (analysis.overallScore >= 60) analysis.readinessLevel = 'intermediate';
  else if (analysis.overallScore >= 40) analysis.readinessLevel = 'developing';

  // Generate recommendations
  if (analysis.weaknesses.length > 0) {
    analysis.weaknesses.slice(0, 3).forEach(w => {
      analysis.recommendations.push({
        priority: 'HIGH',
        message: `Focus on ${w.skill} — your current score is ${w.score}%. Practice daily for 2 weeks.`,
        action: `Solve 5 ${w.skill} problems daily`,
      });
    });
  }

  if (taskCompletionRate < 70) {
    analysis.recommendations.push({ priority: 'HIGH', message: 'Improve daily task completion rate. Consistency is key to placement preparation.', action: 'Complete at least 4/5 daily tasks' });
  }

  if (interviews.length < 5) {
    analysis.recommendations.push({ priority: 'MEDIUM', message: 'Take more mock interviews to improve communication and confidence.', action: 'Schedule 2 mock interviews per week' });
  }

  if (analysis.learningVelocity === 'declining') {
    analysis.recommendations.push({ priority: 'HIGH', message: 'Your scores are declining. Consider revising fundamentals and reducing pace.', action: 'Spend 1 hour daily on concept revision' });
  }

  if (analysis.recommendations.length === 0) {
    analysis.recommendations.push({ priority: 'LOW', message: 'Excellent progress! Keep maintaining your consistency and pace.', action: 'Continue current study plan' });
  }

  // Personalized weekly plan based on weaknesses
  analysis.personalizedPlan = generateWeeklyPlanFromAnalysis(analysis);

  return analysis;
}

function generateWeeklyPlanFromAnalysis(analysis) {
  const plan = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weakTopics = analysis.weaknesses.map(w => w.skill);
  const strongTopics = analysis.strengths.map(s => s.skill);

  days.forEach((day, i) => {
    const dayPlan = { day, tasks: [] };

    // Weak area focus (2 tasks per day from weak areas)
    if (weakTopics.length > 0) {
      const topic = weakTopics[i % weakTopics.length];
      dayPlan.tasks.push({ type: 'CODING', title: `Practice ${topic} Problems`, topic, duration: '60 min', priority: 'HIGH' });
    }

    // Core DSA task
    dayPlan.tasks.push({ type: 'CODING', title: `Solve ${i < 3 ? '2 Easy' : '2 Medium'} DSA Problems`, topic: 'DSA', duration: '45 min', priority: 'MEDIUM' });

    // MCQ/Theory every other day
    if (i % 2 === 0) {
      dayPlan.tasks.push({ type: 'MCQ', title: 'Practice 20 MCQs', topic: ['DBMS', 'OS', 'CN', 'OOP'][Math.floor(i / 2) % 4], duration: '30 min', priority: 'MEDIUM' });
    }

    // Weekend extras
    if (i === 5) dayPlan.tasks.push({ type: 'TEST', title: 'Weekly Mock Test', topic: 'All Topics', duration: '90 min', priority: 'HIGH' });
    if (i === 6) dayPlan.tasks.push({ type: 'INTERVIEW', title: 'Mock Interview Session', topic: 'Interview Prep', duration: '60 min', priority: 'HIGH' });

    plan.push(dayPlan);
  });

  return plan;
}
