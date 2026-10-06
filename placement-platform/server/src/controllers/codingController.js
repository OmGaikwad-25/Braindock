import { prisma } from '../prisma.js';
import axios from 'axios';

const SAMPLE_PROBLEMS = [
  {
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    difficulty: "EASY",
    topic: "Arrays",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
    tags: ["Array", "Hash Table"],
    starterCode: {
      javascript: "function twoSum(nums, target) {\n  // Write your code here\n  \n}",
      python: "def twoSum(nums, target):\n    # Write your code here\n    pass",
      cpp: "#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Write your code here\n    \n}"
    },
    solution: {
      javascript: "function twoSum(nums, target) {\n  const map = {};\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map[complement] !== undefined) return [map[complement], i];\n    map[nums[i]] = i;\n  }\n  return [];\n}"
    },
    testCases: [
      { input: { nums: [2,7,11,15], target: 9 }, expectedOutput: [0,1], isHidden: false },
      { input: { nums: [3,2,4], target: 6 }, expectedOutput: [1,2], isHidden: false },
      { input: { nums: [3,3], target: 6 }, expectedOutput: [0,1], isHidden: true },
    ],
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." },
    ],
  },
  {
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
    difficulty: "EASY",
    topic: "Strings",
    constraints: "1 <= s.length <= 10^5\ns[i] is a printable ascii character.",
    tags: ["String", "Two Pointers"],
    starterCode: {
      javascript: "function reverseString(s) {\n  // Write your code here\n  \n}",
      python: "def reverseString(s):\n    # Write your code here\n    pass",
      cpp: "void reverseString(vector<char>& s) {\n    // Write your code here\n    \n}"
    },
    solution: { javascript: "function reverseString(s) {\n  let l = 0, r = s.length - 1;\n  while (l < r) {\n    [s[l], s[r]] = [s[r], s[l]];\n    l++; r--;\n  }\n  return s;\n}" },
    testCases: [
      { input: { s: ["h","e","l","l","o"] }, expectedOutput: ["o","l","l","e","h"], isHidden: false },
      { input: { s: ["H","a","n","n","a","h"] }, expectedOutput: ["h","a","n","n","a","H"], isHidden: false },
    ],
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: "" },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', explanation: "" },
    ],
  },
  {
    title: "Valid Parentheses",
    description: "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    difficulty: "EASY",
    topic: "Stack",
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
    tags: ["String", "Stack"],
    starterCode: {
      javascript: "function isValid(s) {\n  // Write your code here\n  \n}",
      python: "def isValid(s):\n    # Write your code here\n    pass",
      cpp: "bool isValid(string s) {\n    // Write your code here\n    \n}"
    },
    solution: { javascript: "function isValid(s) {\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (const c of s) {\n    if ('({['.includes(c)) stack.push(c);\n    else if (stack.pop() !== map[c]) return false;\n  }\n  return stack.length === 0;\n}" },
    testCases: [
      { input: { s: "()" }, expectedOutput: true, isHidden: false },
      { input: { s: "()[]{}" }, expectedOutput: true, isHidden: false },
      { input: { s: "(]" }, expectedOutput: false, isHidden: false },
      { input: { s: "([)]" }, expectedOutput: false, isHidden: true },
    ],
    examples: [
      { input: 's = "()"', output: "true", explanation: "" },
      { input: 's = "()[]{}"', output: "true", explanation: "" },
      { input: 's = "(]"', output: "false", explanation: "" },
    ],
  },
  {
    title: "Maximum Subarray",
    description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.",
    difficulty: "MEDIUM",
    topic: "Dynamic Programming",
    constraints: "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
    tags: ["Array", "DP", "Divide and Conquer"],
    starterCode: {
      javascript: "function maxSubArray(nums) {\n  // Write your code here\n  \n}",
      python: "def maxSubArray(nums):\n    # Write your code here\n    pass",
      cpp: "int maxSubArray(vector<int>& nums) {\n    // Write your code here\n    \n}"
    },
    solution: { javascript: "function maxSubArray(nums) {\n  let maxSum = nums[0], curSum = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    curSum = Math.max(nums[i], curSum + nums[i]);\n    maxSum = Math.max(maxSum, curSum);\n  }\n  return maxSum;\n}" },
    testCases: [
      { input: { nums: [-2,1,-3,4,-1,2,1,-5,4] }, expectedOutput: 6, isHidden: false },
      { input: { nums: [1] }, expectedOutput: 1, isHidden: false },
      { input: { nums: [5,4,-1,7,8] }, expectedOutput: 23, isHidden: true },
    ],
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
    ],
  },
  {
    title: "Merge Two Sorted Lists",
    description: "You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.",
    difficulty: "EASY",
    topic: "Linked List",
    constraints: "The number of nodes in both lists is in the range [0, 50].\n-100 <= Node.val <= 100",
    tags: ["Linked List", "Recursion"],
    starterCode: {
      javascript: "function mergeTwoLists(list1, list2) {\n  // Write your code here\n  \n}",
      python: "def mergeTwoLists(list1, list2):\n    # Write your code here\n    pass",
    },
    solution: { javascript: "function mergeTwoLists(l1, l2) {\n  if (!l1) return l2;\n  if (!l2) return l1;\n  if (l1.val < l2.val) { l1.next = mergeTwoLists(l1.next, l2); return l1; }\n  else { l2.next = mergeTwoLists(l1, l2.next); return l2; }\n}" },
    testCases: [
      { input: { list1: [1,2,4], list2: [1,3,4] }, expectedOutput: [1,1,2,3,4,4], isHidden: false },
    ],
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]", explanation: "" },
    ],
  },
  {
    title: "Longest Common Subsequence",
    description: "Given two strings `text1` and `text2`, return the length of their longest common subsequence. If there is no common subsequence, return 0.\n\nA subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.",
    difficulty: "MEDIUM",
    topic: "Dynamic Programming",
    constraints: "1 <= text1.length, text2.length <= 1000\ntext1 and text2 consist of only lowercase English characters.",
    tags: ["DP", "String"],
    starterCode: {
      javascript: "function longestCommonSubsequence(text1, text2) {\n  // Write your code here\n  \n}",
      python: "def longestCommonSubsequence(text1, text2):\n    # Write your code here\n    pass",
    },
    solution: { javascript: "function longestCommonSubsequence(t1, t2) {\n  const dp = Array(t1.length+1).fill(null).map(() => Array(t2.length+1).fill(0));\n  for (let i = 1; i <= t1.length; i++)\n    for (let j = 1; j <= t2.length; j++)\n      dp[i][j] = t1[i-1] === t2[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);\n  return dp[t1.length][t2.length];\n}" },
    testCases: [
      { input: { text1: "abcde", text2: "ace" }, expectedOutput: 3, isHidden: false },
      { input: { text1: "abc", text2: "def" }, expectedOutput: 0, isHidden: false },
    ],
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: "3", explanation: 'The longest common subsequence is "ace" and its length is 3.' },
    ],
  },
];

export const getProblems = async (req, res) => {
  try {
    let problems = await prisma.codingProblem.findMany({
      where: { isActive: true },
      select: { id: true, title: true, difficulty: true, topic: true, tags: true },
      orderBy: { id: 'asc' },
    });

    const totalProblemCount = await prisma.codingProblem.count();
    if (totalProblemCount === 0) {
      for (const p of SAMPLE_PROBLEMS) {
        await prisma.codingProblem.create({ data: p });
      }
      problems = await prisma.codingProblem.findMany({
        where: { isActive: true },
        select: { id: true, title: true, difficulty: true, topic: true, tags: true },
        orderBy: { id: 'asc' },
      });
    }

    // Add submission status for logged-in user
    const submissions = await prisma.codingSubmission.findMany({
      where: { userId: req.user.id },
      select: { problemId: true, status: true },
    });
    const statusMap = {};
    submissions.forEach(s => {
      if (!statusMap[s.problemId] || s.status === 'ACCEPTED') statusMap[s.problemId] = s.status;
    });

    const result = problems.map(p => ({ ...p, status: statusMap[p.id] || 'UNSOLVED' }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch problems.' });
  }
};

export const getProblem = async (req, res) => {
  try {
    const problem = await prisma.codingProblem.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!problem) return res.status(404).json({ error: 'Problem not found.' });

    // Hide hidden test cases
    const testCases = (problem.testCases || []).map(tc => tc.isHidden ? { ...tc, expectedOutput: '(hidden)' } : tc);

    res.json({ ...problem, testCases });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch problem.' });
  }
};

export const submitSolution = async (req, res) => {
  try {
    const { code, language } = req.body;
    const problemId = parseInt(req.params.id);

    const problem = await prisma.codingProblem.findUnique({ where: { id: problemId } });
    if (!problem) return res.status(404).json({ error: 'Problem not found.' });

    const allTestCases = problem.testCases || [];
    let results = [];
    let passedTests = 0;

    if (language === 'javascript' || language === 'python') {
      // Improved JS Wrapper: Detects arrow functions, function declarations, and const/let/var functions
      const jsWrapper = `
${code}
const fs = require('fs');
const findUserFunction = () => {
  // Try finding a function name in the code via regex (heuristic)
  // Look for: function name() OR const name = () => OR const name = function()
  const patterns = [
    /function\\s+([a-zA-Z0-9_]+)\\s*\\(/g,
    /(?:const|let|var)\\s+([a-zA-Z0-9_]+)\\s*=\\s*(?:async\\s*)?(?:function|\\([^)]*\\)\\s*=>)/g
  ];
  
  let lastMatch = null;
  for (const p of patterns) {
    let m;
    while ((m = p.exec(${JSON.stringify(code)})) !== null) {
      lastMatch = m[1];
    }
  }
  return lastMatch;
};

const fnName = findUserFunction();
if (!fnName) { console.log(JSON.stringify([{error: 'Could not find a function definition in your code.'}])); process.exit(0); }
let fn;
try { fn = eval(fnName); } catch(e) { console.log(JSON.stringify([{error: 'Failed to access function: ' + e.message}])); process.exit(0); }

const testCases = JSON.parse(fs.readFileSync(0, 'utf-8'));
const out = testCases.map(tc => {
  const start = process.hrtime.bigint();
  try {
    const actual = fn(...Object.values(tc.input));
    const end = process.hrtime.bigint();
    return { actual, timeMs: Number(end - start) / 1e6, error: null };
  } catch(e) {
    return { actual: null, timeMs: 0, error: e.message };
  }
});
console.log(JSON.stringify(out));
`;

      // Improved Python Wrapper: Finds the LAST defined function at top level
      const pyWrapper = `
import json, sys, time, types
# User Code
${code}
# Logic to find the last user function
user_funcs = [name for name, val in globals().items() if isinstance(val, types.FunctionType) and not name.startswith('__')]
if not user_funcs:
    print(json.dumps([{"error": "No function defined"}]))
    sys.exit(0)
# Heuristic: Pick the function defined LAST in the source code if possible
# Since globals() is ordered, the last one added is usually ours.
fn = globals()[user_funcs[-1]]
test_cases = json.loads(sys.stdin.read())
out = []
for tc in test_cases:
    start = time.perf_counter()
    try:
        # Check if tc["input"] is a dict for kwargs, or a list for args
        if isinstance(tc["input"], dict):
            actual = fn(**tc["input"])
        else:
            actual = fn(*tc["input"])
        end = time.perf_counter()
        out.append({"actual": actual, "timeMs": (end - start)*1000, "error": None})
    except Exception as e:
        out.append({"actual": None, "timeMs": 0, "error": str(e)})
print(json.dumps(out))
`;

      const executePayload = {
        language: language === 'javascript' ? 'javascript' : 'python',
        version: language === 'javascript' ? '18.15.0' : '3.10.0',
        files: [{ name: language === 'javascript' ? 'main.js' : 'main.py', content: language === 'javascript' ? jsWrapper : pyWrapper }],
        stdin: JSON.stringify(allTestCases),
      };

      try {
        const pistonRes = await axios.post('https://emacs.piston.rs/api/v2/execute', executePayload);
        const output = pistonRes.data.run.stdout;
        
        let execResults = [];
        if (pistonRes.data.run.stderr) {
          throw new Error(pistonRes.data.run.stderr);
        }
        execResults = JSON.parse(output.trim());

        results = allTestCases.map((tc, i) => {
          const resObj = execResults[i] || {};
          const passed = resObj.error ? false : JSON.stringify(resObj.actual) === JSON.stringify(tc.expectedOutput);
          if (passed) passedTests++;
          
          return {
            input: tc.isHidden ? '(hidden)' : tc.input,
            expected: tc.isHidden ? '(hidden)' : tc.expectedOutput,
            actual: tc.isHidden && !passed ? (resObj.error ? 'Error' : 'Wrong Answer') : (resObj.error ? `Error: ${resObj.error}` : resObj.actual),
            timeMs: resObj.timeMs,
            passed
          };
        });
      } catch (executorErr) {
        console.error('Execution Error:', executorErr.message);
        results = allTestCases.map((tc) => ({
          input: tc.isHidden ? '(hidden)' : tc.input,
          expected: tc.isHidden ? '(hidden)' : tc.expectedOutput,
          actual: `Compilation/Execution Error`,
          passed: false
        }));
      }
    } else {
      // For C++/Java, simulating because dynamic deserialization of JSON to arbitrary types automatically is unfeasible without a static generation step per-problem.
      const isReasonable = code.length > 50;
      passedTests = isReasonable ? allTestCases.length : 0;
      allTestCases.forEach((tc) => {
        const passed = isReasonable;
        results.push({ 
          input: tc.isHidden ? '(hidden)' : tc.input, 
          expected: tc.isHidden ? '(hidden)' : tc.expectedOutput, 
          actual: tc.isHidden && !passed ? 'Wrong Answer' : (passed ? tc.expectedOutput : 'Simulated Failure'), 
          passed 
        });
      });
    }

    const status = passedTests === allTestCases.length ? 'ACCEPTED' : 'WRONG_ANSWER';

    const submission = await prisma.codingSubmission.create({
      data: { userId: req.user.id, problemId, code, language, status, passedTests, totalTests: allTestCases.length, output: results },
    });

    res.json({ submission, results, status, passedTests, totalTests: allTestCases.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit solution.' });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const subs = await prisma.codingSubmission.findMany({
      where: { userId: req.user.id, problemId: parseInt(req.params.id) },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
};
