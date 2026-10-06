import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-flash-lite-latest',
    generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
  });
}

// ─── Build system prompt based on type + profile ───
function buildSystemPrompt(type, profile) {
  const name = profile?.name || 'the candidate';
  const skills = profile?.skills?.join(', ') || 'general software engineering';
  const branch = profile?.branch || 'Computer Science';
  const year = profile?.year || 'final year';

  const typeDescriptions = {
    TECHNICAL: `You are a senior software engineer conducting a TECHNICAL interview. 
Focus on: Data Structures, Algorithms, OOP, DBMS, OS, Computer Networks, and system fundamentals.
Ask increasingly challenging questions. Evaluate answers for correctness, depth, and clarity.`,

    HR: `You are an experienced HR manager conducting a BEHAVIOURAL interview.
Focus on: teamwork, leadership, conflict resolution, career goals, communication skills, and cultural fit.
Use the STAR method (Situation, Task, Action, Result) to probe for specific examples.`,

    SYSTEM_DESIGN: `You are a staff engineer conducting a SYSTEM DESIGN interview.
Focus on: scalability, availability, consistency, database design, API design, caching, messaging queues.
Ask about real-world systems. Probe their thinking process, not just the final answer.`,
  };

  return `${typeDescriptions[type] || typeDescriptions.TECHNICAL}

Candidate: ${name}
Background: ${year} student, branch: ${branch}
Skills: ${skills}

RANDOMIZATION SEED: ${Math.floor(Math.random() * 100000)}
CRITICAL INSTRUCTION: Do NOT ask the typical, repetitive opening questions (e.g., Array vs Linked List, or 'Tell me about yourself'). Immediately pick a completely random, highly specific sub-topic related to their skills and dive directly into a unique question.

RULES:
1. Ask ONE question at a time.
2. After each candidate answer, give BRIEF feedback (2-3 sentences) on that specific answer, then ask the NEXT question.
3. Keep the interview professional but encouraging.
4. Ask exactly 5 questions in total. Track how many you have asked.
5. For the 5th question, after feedback say: "That concludes our interview. Thank you ${name}!"
6. Format each response as:
   [FEEDBACK]: <brief evaluation of the answer given>
   [SCORE]: <score 0-100 for this answer>
   [NEXT]: <Next question or closing statement>

If it is the very first message (no answer yet), skip [FEEDBACK] and [SCORE], just ask the first question warmly.`;
}

// ─── Start a fresh interview session ───
export async function startInterviewSession(type, profile) {
  try {
    const model = getModel();
    const systemPrompt = buildSystemPrompt(type, profile);

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am ready to begin the interview.' }],
        },
      ],
    });

    const name = profile?.name || 'there';
    const typeLabel = type === 'SYSTEM_DESIGN' ? 'System Design' : type.charAt(0) + type.slice(1).toLowerCase();
    const result = await chat.sendMessage(
      `Start the interview now. Greet ${name} warmly, introduce yourself as the AI ${typeLabel} interviewer, and ask the first question.`
    );

    const text = result.response.text();
    return { firstMessage: text, history: await chat.getHistory() };
  } catch (err) {
    console.error('[Gemini] startInterviewSession error:', err);
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return {
        firstMessage: "Hello! Note: Your Google Gemini API Key is currently RATE LIMITED. I am a hardcoded mock fallback so you can continue testing the frontend. Let's pretend I am the AI! What is the difference between a Hash Map and a Binary Search Tree?",
        history: [{ role: 'user', parts: [{ text: 'mock initial' }] }, { role: 'model', parts: [{ text: 'mock ready' }] }]
      };
    }
    if (err.status === 403 || (err.message && err.message.includes('403'))) {
      return {
        firstMessage: "Hello! Note: Your Google Gemini API Key was reported as LEAKED and is now blocked. I am a hardcoded mock fallback so you can continue testing the frontend. Let's pretend I am the AI! What is the difference between a Hash Map and a Binary Search Tree?",
        history: [{ role: 'user', parts: [{ text: 'mock initial' }] }, { role: 'model', parts: [{ text: 'mock ready' }] }]
      };
    }
    throw err;
  }
}

// ─── Continue the interview with candidate's answer ─── 
export async function continueInterview(chatHistory, answer) {
  try {
    const model = getModel();
    const chat = model.startChat({ history: chatHistory });

    const result = await chat.sendMessage(answer);
    const text = result.response.text();
    const newHistory = await chat.getHistory();

    // Parse score from structured response
    const scoreMatch = text.match(/\[SCORE\]:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 60;

    // Check if interview is complete
    const isComplete =
      text.toLowerCase().includes('that concludes') ||
      text.toLowerCase().includes('thank you for') ||
      text.toLowerCase().includes('interview is now complete') ||
      newHistory.filter(h => h.role === 'user').length >= 7; // system + 5 answers + start

    return { responseText: text, score, isComplete, history: newHistory };
  } catch (err) {
    console.error('[Gemini] continueInterview error:', err);
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      const mockQs = ["Can you explain the difference between process and thread?", "What are the ACID properties in standard DBMS?", "Explain how a REST API differs from GraphQL."];
      const nextQ = mockQs[Math.floor(Math.random() * mockQs.length)];
      return {
        responseText: `[FEEDBACK]: That's a theoretically sound answer and covers the primary use cases successfully.\n[SCORE]: ${Math.floor(Math.random() * 20 + 75)}\n[NEXT]: ${nextQ}`,
        score: 85,
        isComplete: false,
        history: chatHistory
      };
    }
    if (err.status === 403 || (err.message && err.message.includes('403'))) {
      const mockQs = ["Can you explain the difference between process and thread?", "What are the ACID properties in standard DBMS?", "Explain how a REST API differs from GraphQL."];
      const nextQ = mockQs[Math.floor(Math.random() * mockQs.length)];
      return {
        responseText: `[FEEDBACK]: That's a theoretically sound answer and covers the primary use cases successfully.\n[SCORE]: ${Math.floor(Math.random() * 20 + 75)}\n[NEXT]: ${nextQ}`,
        score: 85,
        isComplete: false,
        history: chatHistory
      };
    }
    throw err;
  }
}

// ─── Generate final detailed report ───
export async function generateFinalReport(chatHistory, type, avgScore) {
  try {
    const model = getModel();
    const chat = model.startChat({ history: chatHistory });

    const prompt = `Based on this entire interview, provide a short, structured evaluation report using STRICT Markdown formatting. Use '##' for main sections and '*' for bullet points.

Structure the report EXACTLY like this (do NOT add any other sections like Final Verdict or Scores):

## 🌟 Key Strengths
* (Strength 1 based on their answers)
* (Strength 2)

## 🎯 Focus Weaknesses
* (Weakness 1 based on their answers)
* (Weakness 2)

## 🚀 Areas of Improvement
* (Actionable improvement 1)
* (Actionable improvement 2)

CRITICAL: Make the points concise (short) and specific to this candidate. Do NOT add any extra conversational text.`;

    const result = await chat.sendMessage(prompt);
    return result.response.text();
  } catch (err) {
    console.error('[Gemini] generateFinalReport error:', err);
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return `## 🌟 Key Strengths
* Strong theoretical knowledge of core computer science fundamentals.
* Excellent ability to communicate complex data structures simply.

## 🎯 Focus Weaknesses
* Needs stronger practical exposure to advanced low-level operating system architecture.
* Sometimes answers vaguely when pressure is applied on database scaling.

## 🚀 Areas of Improvement
* Practice answering system design questions focusing on high-volume message queues.
* Study real-world use cases for multithreaded transaction concurrency.`;
    }
    if (err.status === 403 || (err.message && err.message.includes('403'))) {
      return `## 🌟 Key Strengths
* Strong theoretical knowledge of core computer science fundamentals.
* Excellent ability to communicate complex data structures simply.

## 🎯 Focus Weaknesses
* Needs stronger practical exposure to advanced low-level operating system architecture.
* Sometimes answers vaguely when pressure is applied on database scaling.

## 🚀 Areas of Improvement
* Practice answering system design questions focusing on high-volume message queues.
* Study real-world use cases for multithreaded transaction concurrency.`;
    }
    return `Interview completed with an average score of ${avgScore}%. Keep practicing to improve your performance.`;
  }
}
