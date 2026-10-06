import { prisma } from '../prisma.js';

const TASK_TEMPLATES = [
  { title: "Two Sum Problem", description: "Given an array of integers, return indices of the two numbers such that they add up to a target.", type: "CODING", difficulty: "EASY", topic: "Arrays", points: 10 },
  { title: "Reverse Linked List", description: "Reverse a singly linked list iteratively and recursively.", type: "CODING", difficulty: "EASY", topic: "Linked List", points: 10 },
  { title: "Binary Search Implementation", description: "Implement binary search on a sorted array.", type: "CODING", difficulty: "EASY", topic: "Searching", points: 10 },
  { title: "Valid Parentheses", description: "Check if a string of parentheses is valid using a stack.", type: "CODING", difficulty: "EASY", topic: "Stack", points: 15 },
  { title: "Merge Sort", description: "Implement merge sort and analyze its time complexity.", type: "CODING", difficulty: "MEDIUM", topic: "Sorting", points: 20 },
  { title: "LRU Cache Design", description: "Design a Least Recently Used cache with get and put operations.", type: "CODING", difficulty: "HARD", topic: "Design", points: 30 },
  { title: "Database Normalization MCQ", description: "Test your understanding of 1NF, 2NF, 3NF, and BCNF.", type: "MCQ", difficulty: "MEDIUM", topic: "DBMS", points: 15 },
  { title: "OS Process Scheduling MCQ", description: "Practice questions on CPU scheduling algorithms.", type: "MCQ", difficulty: "MEDIUM", topic: "Operating Systems", points: 15 },
  { title: "Networking Fundamentals MCQ", description: "Practice questions on OSI model and TCP/IP.", type: "MCQ", difficulty: "EASY", topic: "Networks", points: 10 },
  { title: "OOP Concepts Review", description: "Learn and practice Object Oriented Programming concepts.", type: "LEARNING", difficulty: "EASY", topic: "OOP", points: 10 },
  { title: "System Design Basics", description: "Learn about scalability, load balancing, and caching.", type: "LEARNING", difficulty: "MEDIUM", topic: "System Design", points: 15 },
  { title: "Dynamic Programming - Fibonacci", description: "Solve Fibonacci using memoization and tabulation.", type: "CODING", difficulty: "EASY", topic: "DP", points: 15 },
  { title: "Graph BFS/DFS", description: "Implement Breadth First Search and Depth First Search.", type: "CODING", difficulty: "MEDIUM", topic: "Graphs", points: 20 },
  { title: "SQL Query Practice", description: "Write SQL queries involving JOINs, GROUP BY, and subqueries.", type: "PRACTICE", difficulty: "MEDIUM", topic: "SQL", points: 15 },
  { title: "Aptitude - Time & Work", description: "Practice aptitude problems on time, work, and pipes.", type: "MCQ", difficulty: "EASY", topic: "Aptitude", points: 10 },
  { title: "Binary Tree Traversals", description: "Implement inorder, preorder, and postorder traversals.", type: "CODING", difficulty: "MEDIUM", topic: "Trees", points: 20 },
  { title: "Dijkstra's Algorithm", description: "Implement shortest path algorithm for weighted graphs.", type: "CODING", difficulty: "HARD", topic: "Graphs", points: 30 },
  { title: "CN - HTTP/HTTPS MCQ", description: "Test your knowledge of web protocols.", type: "MCQ", difficulty: "EASY", topic: "Networks", points: 10 },
  { title: "Heap Implementation", description: "Implement min-heap and max-heap with insert and extract.", type: "CODING", difficulty: "MEDIUM", topic: "Heap", points: 20 },
  { title: "String Matching - KMP", description: "Implement Knuth-Morris-Pratt pattern matching algorithm.", type: "CODING", difficulty: "HARD", topic: "Strings", points: 30 },
];

export const getDailyTasks = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let userTasks = await prisma.userTask.findMany({
      where: {
        userId: req.user.id,
        assignedDate: { gte: today, lt: tomorrow },
      },
      include: { task: true },
      orderBy: { id: 'asc' },
    });

    // If no tasks assigned today, auto-assign 3-5 tasks
    if (userTasks.length === 0) {
      const existingTasks = await prisma.task.findMany();
      let tasks = existingTasks;

      if (tasks.length === 0) {
        // Seed tasks
        for (const t of TASK_TEMPLATES) {
          await prisma.task.create({ data: t });
        }
        tasks = await prisma.task.findMany();
      }

      // Pick 4 random tasks
      const shuffled = tasks.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 4);

      for (const task of selected) {
        await prisma.userTask.create({
          data: { userId: req.user.id, taskId: task.id, assignedDate: today },
        });
      }

      userTasks = await prisma.userTask.findMany({
        where: { userId: req.user.id, assignedDate: { gte: today, lt: tomorrow } },
        include: { task: true },
        orderBy: { id: 'asc' },
      });
    }

    // Calculate streak
    let streak = 0;
    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const nextDay = new Date(checkDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const dayTasks = await prisma.userTask.findMany({
        where: {
          userId: req.user.id,
          assignedDate: { gte: checkDate, lt: nextDay },
        },
      });
      if (dayTasks.length > 0 && dayTasks.every(t => t.status === 'COMPLETED')) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
      if (streak > 365) break;
    }

    // Check if today is complete too
    const todayComplete = userTasks.length > 0 && userTasks.every(t => t.status === 'COMPLETED');
    if (todayComplete) streak++;

    res.json({ tasks: userTasks, streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch daily tasks.' });
  }
};

export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userTask = await prisma.userTask.update({
      where: { id: parseInt(id) },
      data: { status: 'COMPLETED', completionDate: new Date() },
      include: { task: true },
    });
    res.json(userTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete task.' });
  }
};

export const getTaskHistory = async (req, res) => {
  try {
    const history = await prisma.userTask.findMany({
      where: { userId: req.user.id },
      include: { task: true },
      orderBy: { assignedDate: 'desc' },
      take: 50,
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task history.' });
  }
};

export const getStudyPlan = async (req, res) => {
  try {
    const plan = await prisma.studyPlan.findFirst({
      where: { userId: req.user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(plan || { plan: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch study plan.' });
  }
};
