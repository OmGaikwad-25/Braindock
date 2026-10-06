import { prisma } from '../prisma.js';
import { startInterviewSession, continueInterview, generateFinalReport } from '../services/geminiService.js';

export const startInterview = async (req, res) => {
  try {
    const { type } = req.body;
    const interviewType = type || 'TECHNICAL';

    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });

    // Call Gemini to start the session
    const { firstMessage, history } = await startInterviewSession(interviewType, profile);

    const interview = await prisma.interview.create({
      data: {
        userId: req.user.id,
        type: interviewType,
        messages: [{ role: 'interviewer', content: firstMessage, timestamp: new Date().toISOString() }],
        // Store Gemini chat history in a metadata field (as JSON)
        feedback: JSON.stringify({ geminiHistory: history, scores: [] }),
      },
    });

    res.json({ interview });
  } catch (err) {
    console.error('[Interview] startInterview error:', err);
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return res.status(429).json({ error: 'Google AI Rate Limit Reached! Please wait exactly 60 seconds before trying again.' });
    }
    res.status(500).json({ error: 'Failed to start interview. Check your Gemini API key.' });
  }
};

export const answerQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer?.trim()) return res.status(400).json({ error: 'Answer cannot be empty.' });

    const interview = await prisma.interview.findUnique({ where: { id: parseInt(id) } });
    if (!interview) return res.status(404).json({ error: 'Interview not found.' });

    // Restore Gemini chat history
    let metadata = {};
    try { metadata = JSON.parse(interview.feedback || '{}'); } catch (e) { metadata = { geminiHistory: [], scores: [] }; }
    const geminiHistory = metadata.geminiHistory || [];
    const scores = metadata.scores || [];

    // Send answer to Gemini and get response
    const { responseText, score, isComplete, history: newHistory } = await continueInterview(geminiHistory, answer);

    scores.push(score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Update messages
    const messages = [...(interview.messages || [])];
    messages.push({ role: 'candidate', content: answer, timestamp: new Date().toISOString() });
    messages.push({ role: 'interviewer', content: responseText, score, timestamp: new Date().toISOString() });

    let finalFeedback = JSON.stringify({ geminiHistory: newHistory, scores });

    // If interview is complete, generate the full report
    if (isComplete) {
      const report = await generateFinalReport(newHistory, interview.type, avgScore);
      finalFeedback = JSON.stringify({ geminiHistory: newHistory, scores, finalReport: report });
    }

    const updatedInterview = await prisma.interview.update({
      where: { id: parseInt(id) },
      data: {
        messages,
        score: avgScore,
        feedback: finalFeedback,
      },
    });

    res.json({ interview: updatedInterview, isComplete, responseText, score });
  } catch (err) {
    console.error('[Interview] answerQuestion error:', err);
    res.status(500).json({ error: 'Failed to process answer.' });
  }
};

export const endInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await prisma.interview.findUnique({ where: { id: parseInt(id) } });
    if (!interview) return res.status(404).json({ error: 'Interview not found.' });

    const duration = Math.max(1, Math.round((Date.now() - new Date(interview.createdAt).getTime()) / 60000));

    // Get the final report from metadata
    let metadata = {};
    try { metadata = JSON.parse(interview.feedback || '{}'); } catch (e) {}
    
    let finalReport = metadata.finalReport;

    // If there is no final report yet (e.g., they ended early), generate it now
    if (!finalReport && metadata.geminiHistory) {
      finalReport = await generateFinalReport(metadata.geminiHistory, interview.type, interview.score || 0);
    } else if (!finalReport) {
       finalReport = "Interview ended before any questions were answered.";
    }

    const updated = await prisma.interview.update({
      where: { id: parseInt(id) },
      data: { duration, feedback: finalReport },
    });

    res.json({ ...updated, finalReport });
  } catch (err) {
    console.error('[Interview] endInterview error:', err);
    res.status(500).json({ error: 'Failed to end interview.' });
  }
};

export const getInterviewHistory = async (req, res) => {
  try {
    const interviews = await prisma.interview.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, type: true, score: true, duration: true, createdAt: true },
    });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interview history.' });
  }
};
