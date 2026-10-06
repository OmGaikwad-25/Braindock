import { prisma } from '../prisma.js';

const ROADMAP_PLANS = [
  {
    title: "Sprint Plan",
    duration: 3,
    price: 999,
    description: "Intensive 3-month placement preparation for students who need to prepare quickly.",
    features: ["Daily DSA Problems", "Weekly Mock Tests", "2 Mock Interviews/week", "Core CS Revision", "Aptitude Practice", "Resume Review"],
    plan: generatePlan(3),
  },
  {
    title: "Standard Plan",
    duration: 4,
    price: 1499,
    description: "Comprehensive 4-month plan with balanced preparation across all areas.",
    features: ["Daily DSA Problems", "Weekly Mock Tests", "3 Mock Interviews/week", "Core CS Deep Dive", "Aptitude & Reasoning", "Resume + LinkedIn Review", "System Design Basics", "Group Discussion Practice"],
    plan: generatePlan(4),
  },
  {
    title: "Complete Plan",
    duration: 5,
    price: 1999,
    description: "The ultimate 5-month roadmap covering everything from basics to advanced placement preparation.",
    features: ["Daily DSA Problems (Easy→Hard)", "Weekly Mock Tests", "5 Mock Interviews/week", "Core CS Mastery", "Advanced Aptitude", "Resume + LinkedIn + Portfolio", "System Design (Advanced)", "GD & HR Prep", "Company-Specific Prep", "Mentorship Support"],
    plan: generatePlan(5),
  },
];

function generatePlan(months) {
  const weeks = months * 4;
  const plan = [];
  const topics = [
    { month: 1, title: "Foundation Building", weeks: [
      { week: 1, focus: "Arrays & Strings", tasks: ["Solve 15 easy array problems", "Learn string manipulation techniques", "Practice 20 aptitude MCQs", "Revise DBMS basics"] },
      { week: 2, focus: "Linked Lists & Stack/Queue", tasks: ["Implement linked list operations", "Solve 10 stack/queue problems", "Practice OS concepts MCQs", "Start resume building"] },
      { week: 3, focus: "Recursion & Backtracking", tasks: ["Master recursion patterns", "Solve 10 backtracking problems", "Practice CN fundamentals", "Mock interview - Technical"] },
      { week: 4, focus: "Trees & BST", tasks: ["Implement tree traversals", "Solve 15 tree problems", "Weekly comprehensive test", "Mock interview - HR"] },
    ]},
    { month: 2, title: "Intermediate Mastery", weeks: [
      { week: 5, focus: "Graphs - BFS/DFS", tasks: ["Learn graph representations", "Solve 10 graph problems", "DBMS normalization deep dive", "Practice aptitude - Time & Work"] },
      { week: 6, focus: "Dynamic Programming", tasks: ["Learn DP patterns (1D, 2D)", "Solve 15 DP problems", "OS process management", "Mock interview - Technical"] },
      { week: 7, focus: "Greedy & Binary Search", tasks: ["Master binary search patterns", "Solve 10 greedy problems", "CN - TCP/IP protocols", "Mock interview - HR"] },
      { week: 8, focus: "Hashing & Heap", tasks: ["Implement hash tables", "Solve priority queue problems", "Weekly comprehensive test", "System design introduction"] },
    ]},
    { month: 3, title: "Advanced Preparation", weeks: [
      { week: 9, focus: "Advanced DP & Graphs", tasks: ["Solve medium-hard DP problems", "Advanced graph algorithms", "OOP design patterns", "Mock interview - System Design"] },
      { week: 10, focus: "Tries, Segment Trees", tasks: ["Implement trie operations", "Range query problems", "SQL advanced queries", "Company-specific prep"] },
      { week: 11, focus: "Company-Specific Prep", tasks: ["Top 50 interview questions", "Previous year papers", "Full-length mock tests", "Group discussion practice"] },
      { week: 12, focus: "Revision & Mock Drives", tasks: ["Complete revision", "2 full mock placement drives", "Final resume polish", "Behavioral interview practice"] },
    ]},
    { month: 4, title: "Deep Specialization", weeks: [
      { week: 13, focus: "System Design Essentials", tasks: ["Load balancing & caching", "Database scaling", "Microservices architecture", "Mock system design interview"] },
      { week: 14, focus: "Advanced CS Concepts", tasks: ["Distributed systems basics", "Security fundamentals", "Cloud computing intro", "Mock interview - Full round"] },
      { week: 15, focus: "Competitive Programming", tasks: ["Contest participation", "Hard problem solving", "Optimization techniques", "Time management practice"] },
      { week: 16, focus: "Final Sprint", tasks: ["Weak area revision", "Mock placement drives", "Confidence building", "Interview etiquette"] },
    ]},
    { month: 5, title: "Mastery & Placement Ready", weeks: [
      { week: 17, focus: "Advanced System Design", tasks: ["Design Netflix/Uber architecture", "CAP theorem deep dive", "Caching strategies", "Mock architecture review"] },
      { week: 18, focus: "Leadership & Soft Skills", tasks: ["Team management scenarios", "Conflict resolution practice", "Presentation skills", "Executive presence coaching"] },
      { week: 19, focus: "Company Deep Dives", tasks: ["FAANG prep specific", "Startup interview prep", "Service company strategies", "Salary negotiation tips"] },
      { week: 20, focus: "Placement Ready", tasks: ["Final comprehensive test", "Last mock placement drive", "Mental preparation", "Day-of interview strategies"] },
    ]},
  ];

  for (let i = 0; i < months; i++) {
    if (topics[i]) plan.push(topics[i]);
  }
  return plan;
}

export const getRoadmaps = async (req, res) => {
  try {
    let roadmaps = await prisma.roadmap.findMany({ where: { isActive: true }, orderBy: { duration: 'asc' } });

    if (roadmaps.length === 0) {
      for (const r of ROADMAP_PLANS) {
        await prisma.roadmap.create({ data: r });
      }
      roadmaps = await prisma.roadmap.findMany({ where: { isActive: true }, orderBy: { duration: 'asc' } });
    }

    // Check user purchases
    const purchased = await prisma.userRoadmap.findMany({ where: { userId: req.user.id } });
    const purchasedIds = purchased.map(p => p.roadmapId);

    const result = roadmaps.map(r => ({ ...r, isPurchased: purchasedIds.includes(r.id) }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch roadmaps.' });
  }
};

export const purchaseRoadmap = async (req, res) => {
  try {
    const roadmapId = parseInt(req.params.id);
    const existing = await prisma.userRoadmap.findUnique({
      where: { userId_roadmapId: { userId: req.user.id, roadmapId } },
    });
    if (existing) return res.status(400).json({ error: 'Already purchased.' });

    const userRoadmap = await prisma.userRoadmap.create({
      data: { userId: req.user.id, roadmapId },
      include: { roadmap: true },
    });
    res.json(userRoadmap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to purchase roadmap.' });
  }
};

export const getMyRoadmap = async (req, res) => {
  try {
    const userRoadmap = await prisma.userRoadmap.findFirst({
      where: { userId: req.user.id, isActive: true },
      include: { roadmap: true },
      orderBy: { purchasedAt: 'desc' },
    });
    res.json(userRoadmap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roadmap.' });
  }
};
