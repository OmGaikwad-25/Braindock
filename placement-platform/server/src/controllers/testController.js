import { prisma } from '../prisma.js';

const TEST_QUESTION_BANK = [
  { question: "What is the time complexity of inserting an element at the beginning of an array?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correct: 1, topic: "DSA" },
  { question: "Which traversal of a BST gives sorted output?", options: ["Preorder", "Inorder", "Postorder", "Level order"], correct: 1, topic: "Trees" },
  { question: "What is the purpose of the 'virtual' keyword in C++?", options: ["To create a virtual machine", "To achieve runtime polymorphism", "To allocate virtual memory", "To create templates"], correct: 1, topic: "OOP" },
  { question: "Which scheduling algorithm may cause starvation?", options: ["Round Robin", "FCFS", "SJF", "All of above"], correct: 2, topic: "OS" },
  { question: "TCP is a ___ protocol.", options: ["Connectionless", "Connection-oriented", "Message-oriented", "None"], correct: 1, topic: "Networks" },
  { question: "What is normalization in DBMS?", options: ["Adding redundancy", "Reducing redundancy", "Creating backups", "Indexing tables"], correct: 1, topic: "DBMS" },
  { question: "What does ACID stand for in databases?", options: ["Atomicity, Consistency, Isolation, Durability", "Addition, Consistency, Isolation, Durability", "Atomicity, Completeness, Isolation, Durability", "Atomicity, Consistency, Integration, Durability"], correct: 0, topic: "DBMS" },
  { question: "What is the space complexity of merge sort?", options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"], correct: 1, topic: "Sorting" },
  { question: "Which of the following is not a creational design pattern?", options: ["Singleton", "Factory", "Observer", "Builder"], correct: 2, topic: "Design Patterns" },
  { question: "What is a semaphore in OS?", options: ["A type of memory", "A synchronization tool", "A scheduling algorithm", "A file system"], correct: 1, topic: "OS" },
  { question: "What is the maximum number of edges in a simple graph with n vertices?", options: ["n(n-1)/2", "n²", "2n", "n-1"], correct: 0, topic: "Graphs" },
  { question: "Which layer of OSI model handles routing?", options: ["Data Link", "Transport", "Network", "Session"], correct: 2, topic: "Networks" },
  { question: "What is thrashing in OS?", options: ["Excessive I/O", "Excessive paging", "CPU overheating", "Memory leak"], correct: 1, topic: "OS" },
  { question: "Which HTML status code means 'Not Found'?", options: ["200", "301", "404", "500"], correct: 2, topic: "Web" },
  { question: "What is the output of 3 + '3' in JavaScript?", options: ["6", "33", "Error", "NaN"], correct: 1, topic: "JavaScript" },
  { question: "What is a hash collision?", options: ["Two keys mapping to same index", "Table overflow", "Key not found", "Memory leak"], correct: 0, topic: "Hashing" },
  { question: "Which of the following is a non-linear data structure?", options: ["Array", "Stack", "Queue", "Tree"], correct: 3, topic: "DSA" },
  { question: "What is the worst case of hash table lookup?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correct: 1, topic: "Hashing" },
  { question: "REST API typically uses which protocol?", options: ["FTP", "HTTP", "SMTP", "SSH"], correct: 1, topic: "Web" },
  { question: "What is Big-O notation used for?", options: ["Describing best case", "Describing average case", "Describing upper bound", "Describing lower bound"], correct: 2, topic: "DSA" },
];

export const getWeeklyTest = async (req, res) => {
  try {
    // Fetch MCQs from DB
    const dbQs = await prisma.mCQQuestion.findMany({ where: { isActive: true } });
    const pool = dbQs.length >= 10 ? dbQs : [...dbQs, ...TEST_QUESTION_BANK];

    // Get 10 random questions
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const questions = shuffled.slice(0, 10).map((q, i) => ({
      id: i + 1,
      question: q.question,
      options: q.options,
      topic: q.topic,
    }));

    res.json({ questions, duration: 30 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate test.' });
  }
};

export const submitTest = async (req, res) => {
  try {
    const { answers, questions } = req.body;
    let score = 0;
    const results = [];

    questions.forEach((q, index) => {
      const bankQ = TEST_QUESTION_BANK.find(bq => bq.question === q.question);
      const isCorrect = bankQ && answers[index] === bankQ.correct;
      if (isCorrect) score += 10;
      results.push({
        question: q.question,
        userAnswer: answers[index],
        correct: bankQ?.correct,
        isCorrect,
        topic: q.topic,
      });
    });

    const test = await prisma.test.create({
      data: {
        userId: req.user.id,
        score,
        maxScore: 100,
        answers: results,
        questions: questions,
      },
    });

    res.json({ test, results, score, maxScore: 100 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit test.' });
  }
};

export const getTestHistory = async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch test history.' });
  }
};
