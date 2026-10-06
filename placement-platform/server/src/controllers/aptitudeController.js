import { prisma } from '../prisma.js';

export const getAptitudeCategories = async (req, res) => {
  try {
    const questions = await prisma.mCQQuestion.findMany({
      where: { isActive: true },
      select: { category: true, topic: true }
    });

    // Grouping manually for efficiency and nested structure
    const structure = {};
    
    questions.forEach(q => {
      const cat = q.category || 'General';
      const top = q.topic || 'General';
      
      if (!structure[cat]) {
        structure[cat] = {
          name: cat,
          icon: getModuleIcon(cat),
          topics: {}
        };
      }
      
      if (!structure[cat].topics[top]) {
        structure[cat].topics[top] = {
          name: top,
          count: 0
        };
      }
      
      structure[cat].topics[top].count++;
    });

    // Convert topics object to array for each category
    const formatted = Object.values(structure).map(cat => ({
      ...cat,
      topics: Object.values(cat.topics)
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getQuestionsByTopic = async (req, res) => {
  try {
    const { topic } = req.query;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const questions = await prisma.mCQQuestion.findMany({
      where: { topic, isActive: true },
      orderBy: { id: 'asc' }
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

const getModuleIcon = (category) => {
  const map = {
    'Verbal and Reasoning': '🎭',
    'Interview': '🤝',
    'Technical MCQs': '📡',
    'Puzzles': '🧩',
    'DSA': '🧬',
    'Quantitative': '🔢',
    'Aptitude': '🧠'
  };
  return map[category] || '📝';
};
