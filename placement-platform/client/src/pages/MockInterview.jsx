import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const INTERVIEW_TYPES = [
  { type: 'TECHNICAL', icon: '💻', label: 'Technical', desc: 'DSA, OOP, DBMS, OS, CN', color: '#6366f1' },
  { type: 'HR', icon: '🤝', label: 'Behavioural', desc: 'Communication, Teamwork, Leadership', color: '#10b981' },
  { type: 'SYSTEM_DESIGN', icon: '🏗️', label: 'System Design', desc: 'Architecture, Scalability, Design', color: '#f59e0b' },
];

// ─── Parse Gemini structured response ─── 
function parseGeminiResponse(text) {
  const feedbackMatch = text.match(/\[FEEDBACK\]:\s*([\s\S]*?)(?=\[SCORE\]|\[NEXT\]|$)/i);
  const scoreMatch = text.match(/\[SCORE\]:\s*(\d+)/i);
  const nextMatch = text.match(/\[NEXT\]:\s*([\s\S]*?)$/i);

  if (feedbackMatch || scoreMatch || nextMatch) {
    return {
      feedback: feedbackMatch?.[1]?.trim() || '',
      score: scoreMatch ? parseInt(scoreMatch[1]) : null,
      next: nextMatch?.[1]?.trim() || text,
      isParsed: true,
    };
  }
  return { feedback: '', score: null, next: text, isParsed: false };
}

// ─── Score Badge ───
function ScoreBadge({ score }) {
  if (!score && score !== 0) return null;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{
      display: 'inline-block', background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 700, marginLeft: '8px',
    }}>
      {score}/100
    </span>
  );
}

// ─── Typing Indicator ───
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0,
      }}>🤖</div>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px',
        padding: '12px 16px', display: 'flex', gap: '4px', alignItems: 'center',
      }}>
        {[0, 150, 300].map(delay => (
          <div key={delay} style={{
            width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1',
            animation: 'bounce 1.2s infinite', animationDelay: `${delay}ms`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function MockInterview() {
  const [phase, setPhase] = useState('landing'); // landing | interview | complete
  const [interviewType, setInterviewType] = useState('TECHNICAL');
  const [voiceMode, setVoiceMode] = useState(true);
  const [interview, setInterview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [liveScore, setLiveScore] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [interimAnswer, setInterimAnswer] = useState('');

  const chatRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    api.get('/interviews/history').then(r => setHistory(Array.isArray(r) ? r : [])).catch(() => {});

    // Init speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const r = new SpeechRecognition();
      r.continuous = true;
      r.interimResults = true;
      r.lang = 'en-US';
      r.onresult = (event) => {
        let finalT = '';
        let interimT = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalT += event.results[i][0].transcript;
          else interimT += event.results[i][0].transcript;
        }
        if (finalT) setAnswer(prev => prev + finalT + ' ');
        setInterimAnswer(interimT);
      };
      r.onerror = (e) => { if (e.error !== 'no-speech') setIsListening(false); };
      r.onend = () => { setIsListening(prev => { if (prev) { try { r.start(); } catch {} } return prev; }); };
      recognitionRef.current = r;
    }
    return () => { recognitionRef.current?.abort(); window.speechSynthesis?.cancel(); };
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, thinking]);

  const speakText = (text) => new Promise(resolve => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\*\*/g, '').replace(/\[.*?\]:/g, '').replace(/[#*_]/g, '');
    const u = new SpeechSynthesisUtterance(cleanText);
    u.rate = 0.9; u.pitch = 1; u.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
    if (v) u.voice = v;
    setIsSpeaking(true);
    u.onend = () => { setIsSpeaking(false); resolve(); };
    u.onerror = () => { setIsSpeaking(false); resolve(); };
    window.speechSynthesis.speak(u);
  });

  const startListening = () => {
    if (!recognitionRef.current) { alert('Please use Chrome for voice mode.'); return; }
    setAnswer(''); setIsListening(true);
    try { recognitionRef.current.start(); } catch {}
  };
  const stopListening = () => { setIsListening(false); recognitionRef.current?.stop(); };

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post('/interviews/start', { type: interviewType });
      setInterview(res.interview);
      const firstMsg = res.interview.messages?.[0];
      if (firstMsg) {
        setMessages([firstMsg]);
        setQuestionCount(1);
        if (voiceMode) setTimeout(() => speakText(firstMsg.content), 300);
      }
      setPhase('interview');
    } catch (err) {
      alert(err.message || 'Failed to start interview. Check your Gemini API key.');
      console.error(err);
    }
    setLoading(false);
  };

  const sendAnswer = async () => {
    if (!answer.trim() || thinking) return;
    stopListening();
    const userAnswer = answer.trim();
    setAnswer('');
    setThinking(true);

    // Append candidate message immediately
    setMessages(prev => [...prev, { role: 'candidate', content: userAnswer, timestamp: new Date().toISOString() }]);

    try {
      const res = await api.post(`/interviews/${interview.id}/answer`, { answer: userAnswer });
      const parsed = parseGeminiResponse(res.responseText);

      if (parsed.score) setLiveScore(parsed.score);
      if (parsed.score) setQuestionCount(prev => prev + 1);

      // Append interviewer response
      const interviewerMsg = {
        role: 'interviewer',
        content: res.responseText,
        score: res.score,
        timestamp: new Date().toISOString(),
        parsed,
      };
      setMessages(prev => [...prev, interviewerMsg]);

      if (res.isComplete) {
        // End the interview
        const endRes = await api.post(`/interviews/${interview.id}/end`);
        setInterview(endRes);
        setFinalReport(endRes.finalReport || endRes.feedback);
        setPhase('complete');
      } else if (voiceMode) {
        const toSpeak = parsed.next || res.responseText;
        setTimeout(() => speakText(toSpeak), 300);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'interviewer', content: '⚠️ Error getting response. Please try again.', timestamp: new Date().toISOString() }]);
    }
    setThinking(false);
  };

  const endInterviewEarly = async () => {
    if (!window.confirm("Are you sure you want to end the interview early?")) return;
    setLoading(true);
    stopListening();
    try {
      const endRes = await api.post(`/interviews/${interview.id}/end`);
      setInterview(endRes);
      setFinalReport(endRes.finalReport || "Interview ended early by the user.");
      setPhase('complete');
    } catch (err) {
      console.error(err);
      alert('Failed to end interview.');
    }
    setLoading(false);
  };

  // ══════════════════════════════════════════════
  //  LANDING PAGE
  // ══════════════════════════════════════════════
  if (phase === 'landing') return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '52px', marginBottom: '12px' }}>🤖</div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Mock Interview
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Powered by Google Gemini — Real AI questions, real evaluation, real feedback
        </p>
      </div>

      {/* Interview type selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {INTERVIEW_TYPES.map(t => (
          <div key={t.type} onClick={() => setInterviewType(t.type)} style={{
            border: `2px solid ${interviewType === t.type ? t.color : 'var(--border)'}`,
            borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
            background: interviewType === t.type ? t.color + '11' : 'var(--bg-card)',
            boxShadow: interviewType === t.type ? `0 4px 24px ${t.color}33` : 'none',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>{t.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px', color: interviewType === t.type ? t.color : 'var(--text-primary)' }}>{t.label}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Voice / Text toggle */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ fontWeight: 600, marginBottom: '14px', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Input Mode</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[{ mode: true, icon: '🎙️', label: 'Voice Mode', desc: 'Speak your answers (Chrome recommended)' }, { mode: false, icon: '⌨️', label: 'Text Mode', desc: 'Type your answers' }].map(m => (
            <div key={String(m.mode)} onClick={() => setVoiceMode(m.mode)} style={{
              flex: 1, border: `2px solid ${voiceMode === m.mode ? '#6366f1' : 'var(--border)'}`,
              borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s',
              background: voiceMode === m.mode ? '#6366f111' : 'var(--bg-card)',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{m.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: voiceMode === m.mode ? '#6366f1' : 'var(--text-primary)' }}>{m.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button onClick={startInterview} disabled={loading} style={{
        width: '100%', padding: '16px', borderRadius: '14px', border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
        fontSize: '17px', fontWeight: 700, transition: 'all 0.2s',
        boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? '⏳ Connecting to AI Interviewer...' : `🚀 Start ${INTERVIEW_TYPES.find(t => t.type === interviewType)?.label} Interview`}
      </button>

      {/* History */}
      {history.length > 0 && (
        <div className="card" style={{ marginTop: '28px' }}>
          <div onClick={() => setShowHistory(!showHistory)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
            <div style={{ fontWeight: 700 }}>📋 Interview History ({history.length})</div>
            <span>{showHistory ? '▲' : '▼'}</span>
          </div>
          {showHistory && (
            <div style={{ marginTop: '16px' }}>
              {history.map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{h.type}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginLeft: '12px' }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{h.duration}m</span>
                    <span style={{
                      padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                      background: h.score >= 70 ? '#10b98122' : h.score >= 40 ? '#f59e0b22' : '#ef444422',
                      color: h.score >= 70 ? '#10b981' : h.score >= 40 ? '#f59e0b' : '#ef4444',
                    }}>{h.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════
  //  COMPLETE PAGE
  // ══════════════════════════════════════════════
  if (phase === 'complete') {
    const score = interview?.score || 0;
    const verdict = score >= 80 ? { label: 'Excellent', color: '#10b981', emoji: '🏆' }
      : score >= 60 ? { label: 'Good', color: '#6366f1', emoji: '👍' }
      : score >= 40 ? { label: 'Average', color: '#f59e0b', emoji: '📈' }
      : { label: 'Needs Work', color: '#ef4444', emoji: '💪' };

    const renderMarkdown = (text) => {
      if (!text) return null;
      return text.split('\n').map((rawLine, i) => {
        let isHeader = rawLine.startsWith('## ');
        let isList = rawLine.trim().startsWith('*') && rawLine.trim().length > 1;

        let cleanedLine = rawLine;
        if (isHeader) cleanedLine = cleanedLine.replace(/^##\s+/, '');
        if (isList) cleanedLine = cleanedLine.replace(/^\s*\*\s*/, '');

        const renderInlineStyles = (str) => {
          if (!str.includes('**')) return str;
          const parts = str.split(/(\*\*.*?\*\*)/g);
          return parts.map((p, j) => p.startsWith('**') && p.endsWith('**') ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{p.slice(2, -2)}</strong> : p);
        };

        const contentNodes = renderInlineStyles(cleanedLine);

        if (isHeader) {
          return <h3 key={i} style={{ color: 'var(--accent-primary)', marginTop: i === 0 ? 0 : '24px', marginBottom: '12px', fontSize: '18px', fontWeight: 800 }}>{contentNodes}</h3>;
        }
        if (isList) {
          return <div key={i} style={{ marginLeft: '12px', display: 'flex', gap: '8px', marginBottom: '10px' }}><span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>•</span><span style={{ lineHeight: '1.6' }}>{contentNodes}</span></div>;
        }
        return <div key={i} style={{ marginBottom: rawLine.trim() === '' ? '0' : '10px', minHeight: rawLine.trim() === '' ? '12px' : 'auto', lineHeight: '1.6' }}>{contentNodes}</div>;
      });
    };

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Score header */}
        <div className="card" style={{ textAlign: 'center', padding: '36px', marginBottom: '24px', background: `linear-gradient(135deg, ${verdict.color}11, transparent)`, border: `2px solid ${verdict.color}33` }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>{verdict.emoji}</div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', color: verdict.color }}>Interview Complete!</h2>
          <div style={{ fontSize: '54px', fontWeight: 900, color: verdict.color, marginBottom: '4px' }}>{score}%</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{verdict.label} — {interview?.type} Interview</div>
        </div>

        {/* Gemini report */}
        {finalReport && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 <span>AI Evaluation Report</span>
            </div>
            <div style={{
              fontSize: '14.5px', color: 'var(--text-primary)',
              padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px',
            }}>
              {renderMarkdown(finalReport)}
            </div>
          </div>
        )}

        {/* Transcript */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>📋 Interview Transcript</div>
          {messages.map((msg, i) => {
            const parsed = msg.parsed || parseGeminiResponse(msg.content);
            return (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexDirection: msg.role === 'candidate' ? 'row-reverse' : 'row' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'interviewer' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                  {msg.role === 'interviewer' ? '🤖' : '👤'}
                </div>
                <div style={{ flex: 1, maxWidth: '80%', background: msg.role === 'interviewer' ? 'var(--bg-card)' : '#6366f111', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px', fontSize: '13px', lineHeight: '1.6' }}>
                  {msg.content}
                  {msg.score && <ScoreBadge score={msg.score} />}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => { setPhase('landing'); setInterview(null); setMessages([]); setFinalReport(null); setLiveScore(null); setQuestionCount(0); api.get('/interviews/history').then(r => setHistory(Array.isArray(r) ? r : [])).catch(() => {}); }} style={{
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '15px', fontWeight: 700,
        }}>
          🔄 Start New Interview
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  //  INTERVIEW IN PROGRESS
  // ══════════════════════════════════════════════
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🤖 AI {INTERVIEW_TYPES.find(t => t.type === interviewType)?.label} Interview
            {isSpeaking && <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600, background: '#6366f122', padding: '2px 10px', borderRadius: '20px' }}>🔊 Speaking...</span>}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Powered by Google Gemini AI • {voiceMode ? '🎙️ Voice Mode' : '⌨️ Text Mode'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {liveScore && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: liveScore >= 70 ? '#10b981' : liveScore >= 50 ? '#f59e0b' : '#ef4444' }}>{liveScore}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Last Score</div>
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px' }}>
            Q{questionCount} / 5
          </div>
          <button 
            onClick={endInterviewEarly} 
            disabled={loading || thinking}
            style={{ fontSize: '12px', fontWeight: 600, color: '#fff', background: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', transition: 'all 0.2s', opacity: (loading || thinking) ? 0.6 : 1 }}
            title="End Interview Early"
          >
            🛑 End Early
          </button>
        </div>
      </div>

      {/* Chat window */}
      <div ref={chatRef} style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
        marginBottom: '16px', minHeight: 0,
      }}>
        <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0) } 40% { transform: translateY(-6px) } }`}</style>

        {messages.map((msg, i) => {
          const parsed = msg.parsed || (msg.role === 'interviewer' ? parseGeminiResponse(msg.content) : null);
          const isInterviewer = msg.role === 'interviewer';
          return (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexDirection: isInterviewer ? 'row' : 'row-reverse' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                background: isInterviewer ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px',
              }}>
                {isInterviewer ? '🤖' : '👤'}
              </div>
              <div style={{ maxWidth: '75%' }}>
                {/* If AI response with structured parts, show feedback + question separately */}
                {isInterviewer && parsed?.isParsed && parsed.feedback ? (
                  <>
                    {/* Feedback bubble */}
                    <div style={{ background: '#10b98111', border: '1px solid #10b98133', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', marginBottom: '8px', fontSize: '14px', lineHeight: '1.65' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', display: 'block', marginBottom: '4px' }}>Feedback</span>
                      {parsed.feedback}
                      {msg.score && <ScoreBadge score={msg.score} />}
                    </div>
                    {/* Next question bubble */}
                    {parsed.next && (
                      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', fontSize: '14px', lineHeight: '1.65', fontWeight: 500 }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', display: 'block', marginBottom: '4px' }}>Question</span>
                        {parsed.next}
                        {voiceMode && (
                          <button onClick={() => speakText(parsed.next)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', marginLeft: '8px', opacity: 0.7 }} title="Replay">🔊</button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    background: isInterviewer ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: isInterviewer ? 'var(--text-primary)' : '#fff',
                    border: isInterviewer ? '1px solid var(--border)' : 'none',
                    borderRadius: isInterviewer ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                    padding: '12px 16px', fontSize: '14px', lineHeight: '1.65',
                  }}>
                    {msg.content}
                    {msg.score && <ScoreBadge score={msg.score} />}
                    {isInterviewer && voiceMode && (
                      <button onClick={() => speakText(msg.content)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', marginLeft: '8px', opacity: 0.7 }}>🔊</button>
                    )}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: isInterviewer ? 'left' : 'right' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
        {thinking && <TypingIndicator />}
      </div>

      {/* Input area */}
      <div style={{ flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px' }}>
        {voiceMode ? (
          <div>
            <div style={{ minHeight: '52px', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '10px', marginBottom: '12px', fontSize: '14px', lineHeight: '1.6', color: answer || interimAnswer ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {answer}
              {interimAnswer && <span style={{ opacity: 0.6 }}>{interimAnswer}</span>}
              {!answer && !interimAnswer && (isListening ? '🎙️ Listening... Speak your answer' : 'Click the microphone to start recording your answer')}
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={isListening ? stopListening : startListening} disabled={thinking || isSpeaking} style={{
                width: '48px', height: '48px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: isListening ? '#ef4444' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontSize: '20px', flexShrink: 0, transition: 'all 0.2s',
                boxShadow: isListening ? '0 0 0 6px #ef444422' : '0 4px 12px rgba(99,102,241,0.4)',
              }}>
                {isListening ? '⏹' : '🎙️'}
              </button>
              {answer && (
                <button onClick={sendAnswer} disabled={thinking} style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 700, fontSize: '15px',
                }}>
                  {thinking ? '⏳ AI Evaluating...' : '➤ Submit Answer'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
              disabled={thinking}
              placeholder="Type your answer here... (Enter to send, Shift+Enter for new line)"
              style={{
                flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px',
                resize: 'none', minHeight: '80px', outline: 'none', lineHeight: '1.6',
              }}
            />
            <button onClick={sendAnswer} disabled={thinking || !answer.trim()} style={{
              width: '48px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '20px',
              opacity: thinking || !answer.trim() ? 0.5 : 1,
            }}>
              {thinking ? '⏳' : '➤'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
