import { useState, useEffect } from 'react';
import api from '../services/api';

export default function WeeklyTest() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTest, setShowTest] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);

  useEffect(() => {
    api.get('/tests/history').then(setHistory).catch(console.error).finally(() => setLoading(false));
  }, []);

  const startTest = async () => {
    try {
      const data = await api.get('/tests/weekly');
      setQuestions(data.questions);
      setTimeLeft(data.duration * 60);
      setShowTest(true);
      setAnswers({});
      setCurrentQ(0);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!showTest || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showTest, submitted]);

  const handleSubmit = async () => {
    try {
      const orderedAnswers = questions.map((_, i) => answers[i] ?? -1);
      const res = await api.post('/tests/submit', { answers: orderedAnswers, questions });
      setResult(res);
      setSubmitted(true);
    } catch (err) { console.error(err); }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading...</p></div>;

  if (submitted && result) {
    return (
      <div className="quiz-container">
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>📊 Test Results</h2>

        <div className="stats-grid mb-lg">
          <div className="stat-card">
            <div className="stat-icon purple">📊</div>
            <div className="stat-info"><h3>{result.score}/{result.maxScore}</h3><p>Score</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div className="stat-info"><h3>{result.results.filter(r => r.isCorrect).length}/{result.results.length}</h3><p>Correct</p></div>
          </div>
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Answer Review</h3>
        {result.results.map((r, i) => (
          <div key={i} className="question-card">
            <div className="question-number">Question {i + 1} - {r.topic}</div>
            <div className="question-text">{r.question}</div>
            <div className={`alert ${r.isCorrect ? 'alert-success' : 'alert-error'}`}>
              {r.isCorrect ? '✅ Correct!' : `❌ Wrong. Correct answer: Option ${r.correct + 1}`}
            </div>
          </div>
        ))}

        <button className="btn btn-primary mt-lg" onClick={() => { setSubmitted(false); setShowTest(false); setResult(null); }}>
          ← Back to Tests
        </button>
      </div>
    );
  }

  if (!showTest) {
    return (
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>📋 Weekly Tests</h2>
        <p className="text-secondary mb-lg">Take weekly tests to track your improvement</p>

        <div className="card mb-lg" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Start a Weekly Test</h3>
          <p className="text-secondary mb-md">10 questions from various topics • 30 minutes</p>
          <button className="btn btn-primary btn-lg" onClick={startTest}>🚀 Start Test</button>
        </div>

        {history.length > 0 && (
          <div className="card">
            <div className="card-title mb-md">📈 Test History</div>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Date</th><th>Score</th><th>Max Score</th><th>Percentage</th></tr>
                </thead>
                <tbody>
                  {history.map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 700 }}>{t.score}</td>
                      <td>{t.maxScore}</td>
                      <td>
                        <span className={`tag ${t.score / t.maxScore >= 0.7 ? 'tag-green' : t.score / t.maxScore >= 0.4 ? 'tag-orange' : 'tag-red'}`}>
                          {Math.round((t.score / t.maxScore) * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="quiz-container">
      <div className="quiz-progress">
        <div style={{ flex: 1 }}>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} /></div>
        </div>
        <div className="quiz-progress-text">Q {currentQ + 1}/{questions.length}</div>
        <div className={`quiz-timer ${timeLeft < 300 ? 'warning' : ''}`}>⏱ {formatTime(timeLeft)}</div>
      </div>

      <div className="question-card">
        <div className="question-number">Question {currentQ + 1} • {q.topic}</div>
        <div className="question-text">{q.question}</div>
        <div className="option-list">
          {q.options.map((opt, i) => (
            <div key={i} className={`option-item ${answers[currentQ] === i ? 'selected' : ''}`} onClick={() => setAnswers({ ...answers, [currentQ]: i })}>
              <div className="option-radio" />
              {opt}
            </div>
          ))}
        </div>
      </div>

      {/* Question Nav */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrentQ(i)} style={{
            width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', border: currentQ === i ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
            background: answers[i] !== undefined ? 'var(--accent-primary)' : 'var(--bg-primary)', color: answers[i] !== undefined ? 'white' : 'var(--text-primary)',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          }}>{i + 1}</button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)}>← Previous</button>
        {currentQ < questions.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setCurrentQ(currentQ + 1)}>Next →</button>
        ) : (
          <button className="btn btn-success" onClick={handleSubmit}>Submit Test ✓</button>
        )}
      </div>
    </div>
  );
}
