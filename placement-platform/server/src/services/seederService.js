import { prisma } from '../prisma.js';

const SAMPLE_PROBLEMS = [
  {
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
    difficulty: "EASY",
    topic: "Arrays",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.",
    tags: ["Array", "Hash Table"],
    starterCode: {
      javascript: "function twoSum(nums, target) {\n  // Write your code here\n}",
      python: "def twoSum(nums, target):\n    # Write your code here\n    pass",
      cpp: "#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n}",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n    }\n}"
    },
    testCases: [
      { input: { nums: [2,7,11,15], target: 9 }, expectedOutput: [0,1], isHidden: false },
      { input: { nums: [3,2,4], target: 6 }, expectedOutput: [1,2], isHidden: false },
    ],
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
    ]
  },
  {
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters `s`.",
    difficulty: "EASY",
    topic: "Strings",
    tags: ["String", "Two Pointers"],
    starterCode: {
      javascript: "function reverseString(s) {\n}",
      python: "def reverseString(s):\n    pass"
    },
    testCases: [{ input: { s: ["h","e","l","l","o"] }, expectedOutput: ["o","l","l","e","h"], isHidden: false }],
    examples: [{ input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' }]
  }
];

const TASK_TEMPLATES = [
  { title: "Two Sum Problem", description: "Indices of the two numbers that add up to a target.", type: "CODING", difficulty: "EASY", topic: "Arrays", points: 10 },
  { title: "Database Normalization MCQ", description: "Test your understanding of 1NF, 2NF, 3NF.", type: "MCQ", difficulty: "MEDIUM", topic: "DBMS", points: 15 },
];

const APTITUDE_MCQS = [
  // Verbal and Reasoning
  { question: "Choose the synonym for 'Abundant':", options: ["Scarce", "Plentiful", "Minor", "Limited"], correct: 1, category: "Verbal and Reasoning", topic: "Verbal Ability", difficulty: "EASY", explanation: "Abundant means present in great quantity, which is Plentiful." },
  { question: "Complete the series: 3, 5, 9, 17, 33, ?", options: ["48", "65", "56", "64"], correct: 1, category: "Verbal and Reasoning", topic: "Logical Reasoning", difficulty: "EASY", explanation: "Each number is (previous * 2) - 1. 33 * 2 - 1 = 65." },
  
  // Interview
  { question: "What is the best way to handle a question you don't know the answer to in an HR interview?", options: ["Lie and make up an answer", "Say 'I don't know' and stop", "Admit you don't know but offer to find out or explain how you'd solve it", "Stay silent"], correct: 2, category: "Interview", topic: "HR Interview", difficulty: "EASY", explanation: "Honesty combined with a problem-solving attitude is valued." },
  
  // Programming
  { question: "Which of the following is used to store multiple values of the same type in C++?", options: ["Pointer", "Array", "String", "Reference"], correct: 1, category: "Programming", topic: "C++ Programming", difficulty: "EASY", explanation: "An array is a collection of elements of the same type stored in contiguous memory." },
  { question: "What is the output of 'print(2 ** 3)' in Python?", options: ["6", "8", "9", "5"], correct: 1, category: "Programming", topic: "Python Programming", difficulty: "EASY", explanation: "** is the exponentiation operator. 2^3 = 8." },
  
  // Technical MCQs
  { question: "Which layer of the OSI model is responsible for routing?", options: ["Data Link", "Network", "Transport", "Physical"], correct: 1, category: "Technical MCQs", topic: "Computer Network", difficulty: "MEDIUM", explanation: "The Network layer (Layer 3) handles routing and IP addressing." },
  { question: "In SQL, which command is used to remove all records from a table but keep the structure?", options: ["DELETE", "DROP", "TRUNCATE", "REMOVE"], correct: 2, category: "Technical MCQs", topic: "SQL", difficulty: "MEDIUM", explanation: "TRUNCATE is a DDL command that deletes all rows and is faster than DELETE." },
  
  // Puzzles
  { question: "A clock shows 3:00. What is the angle between the hour and minute hands?", options: ["45 degrees", "90 degrees", "60 degrees", "120 degrees"], correct: 1, category: "Puzzles", topic: "Clock puzzles", difficulty: "EASY", explanation: "At 3:00, the minute hand is at 12 and the hour hand is at 3. Each hour represents 30 degrees (360/12). 3 * 30 = 90." },
  { question: "If 1=5, 2=25, 3=125, 4=625, then 5=?", options: ["3125", "1", "25", "5"], correct: 1, category: "Puzzles", topic: "Logical puzzles", difficulty: "MEDIUM", explanation: "The first line said 1=5, so 5=1." },

  // DSA
  { question: "What is the time complexity to access an element in an array if the index is known?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], correct: 0, category: "DSA", topic: "Arrays", difficulty: "EASY", explanation: "Arrays provide constant time access O(1) via index arithmetic." },
  { question: "In a linked list, what is the time complexity to insert a new node at the beginning?", options: ["O(1)", "O(n)", "O(log n)", "O(1) but requires tail pointer"], correct: 0, category: "DSA", topic: "Linked List", difficulty: "EASY", explanation: "Inserting at the head only requires updating two pointers, regardless of the list size." },
  { question: "Which data structure is typically used for implementing BFS (Breadth First Search) on a graph?", options: ["Stack", "Queue", "Heap", "Tree"], correct: 1, category: "DSA", topic: "Graphs", difficulty: "MEDIUM", explanation: "BFS uses a Queue to keep track of nodes to visit in level-order." }
];

export const seedMockData = async () => {
  try {
    const probCount = await prisma.codingProblem.count();
    if (probCount === 0) {
      console.log('🌱 Seeding Coding Problems...');
      for (const p of SAMPLE_PROBLEMS) {
        await prisma.codingProblem.create({ data: p });
      }
    }

    const taskCount = await prisma.task.count();
    if (taskCount === 0) {
      console.log('🌱 Seeding Task Templates...');
      for (const t of TASK_TEMPLATES) {
        await prisma.task.create({ data: t });
      }
    }

    const mcqCount = await prisma.mCQQuestion.count();
    if (mcqCount === 0) {
      console.log('🌱 Seeding Aptitude MCQs...');
      for (const m of APTITUDE_MCQS) {
        await prisma.mCQQuestion.create({ data: m });
      }
    }
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
};
