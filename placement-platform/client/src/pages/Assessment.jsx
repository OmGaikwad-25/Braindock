import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import api from '../services/api';
import useProctor from '../hooks/useProctor';
import ProctoringOverlay from '../components/ProctoringOverlay';

export default function Assessment() {
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentSection, setCurrentSection] = useState('aptitude');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [showTest, setShowTest] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 min
  const [currentCodingIndex, setCurrentCodingIndex] = useState(0);

  // ── Proctoring ──
  const {
    violations, violationCount, level, proctorReady, lastViolation, videoRef, stopMedia, detectionStats
  } = useProctor(showTest && !submitted);
  
  // State for coding problems tracking
  const [codingData, setCodingData] = useState({}); // { [id]: { code: '', language: '', status: '', results: null, running: false } }

  useEffect(() => {
    Promise.all([
      api.get('/assessments/questions'),
      api.get('/assessments'),
    ]).then(([q, a]) => {
      setQuestions(q);
      setAssessments(a);
      
      // Initialize coding data
      if (q.coding) {
        const initial = {};
        q.coding.forEach(prob => {
          initial[prob.id] = {
            code: prob.starterCode?.javascript || '// Write your JavaScript code here\n',
            language: 'javascript',
            status: 'UNSOLVED',
            results: null,
            running: false
          };
        });
        setCodingData(initial);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

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

  // ── Full Screen Handling ──
  useEffect(() => {
    if (!showTest || submitted) return;

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && !submitted) {
        // User exited full screen
        const msg = { 
          id: 'FULLSCREEN_EXIT', 
          label: 'Exited Full Screen Mode', 
          icon: '🖥️', 
          category: 'System',
          timestamp: new Date().toLocaleTimeString() 
        };
        // We trigger a violation manually if useProctor lets us, 
        // but since we only have the violations array from it, we'll just track it here if needed
        // For now, useProctor will catch TAB_SWITCH which is similar, 
        // but let's make sure the user stays in full screen.
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [showTest, submitted]);

  const handleStartTest = () => {
    setShowTest(true);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('FullScreen request denied:', err);
      });
    }
  };

  const handleRunCode = async (id) => {
    const data = codingData[id];
    setCodingData(prev => ({ ...prev, [id]: { ...prev[id], running: true } }));
    try {
      const res = await api.post(`/coding/${id}/submit`, { code: data.code, language: data.language });
      setCodingData(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          running: false,
          results: res,
          status: res.status
        }
      }));
    } catch (err) {
      console.error(err);
      setCodingData(prev => ({ ...prev, [id]: { ...prev[id], running: false } }));
    }
  };

  const updateCodingData = (id, field, value) => {
    setCodingData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length;
    let codingAttempted = false;
    Object.values(codingData).forEach(d => {
      if (d.code && d.code.trim().length > 50) codingAttempted = true;
    });

    if (answeredCount === 0 && !codingAttempted) {
      const confirmSubmit = window.confirm("You haven't answered any questions yet! Are you sure you want to submit?");
      if (!confirmSubmit) return;
    }

    try {
      // Calculate coding score: Each problem is worth 50%
      // A problem is "solved" if all its test cases pass
      let problemsSolved = 0;
      const codingProblems = Object.values(codingData);
      
      codingProblems.forEach(d => {
        if (d.results && d.results.totalTests > 0 && d.results.passedTests === d.results.totalTests) {
          problemsSolved++;
        }
      });
      
      const codingPercentage = (problemsSolved / 2) * 100;

      stopMedia(); // Stop camera when submitting

      const res = await api.post('/assessments/submit', { 
        answers: { ...answers, coding_results: codingData },
        coding_score: codingPercentage,
        proctor_data: {
          violationCount,
          level,
          violations: violations.slice(0, 50), // Store up to 50 violations
        }
      });
      setResult(res);
      setSubmitted(true);
      // Exit fullscreen after submission
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err) { console.error(err); }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading assessment...</p></div>;

  if (!showTest && !submitted) {
    return (
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>📝 Initial Assessment</h2>
        <p className="text-secondary mb-lg">Take the assessment to get a personalized study plan</p>

        <div className="card mb-lg">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Ready for your assessment?</h3>
            <p className="text-secondary" style={{ maxWidth: '500px', margin: '0 auto 24px' }}>
              This 30-minute assessment covers aptitude, technical MCQs, and coding questions. Your personalized study plan will be generated based on the results.
            </p>
            <div className="tags-container" style={{ justifyContent: 'center', marginBottom: '24px' }}>
              <span className="tag tag-purple">5 Aptitude Questions</span>
              <span className="tag tag-blue">10 Technical MCQs</span>
              <span className="tag tag-green">2 Coding Questions</span>
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleStartTest}>
              🚀 Start Assessment
            </button>
          </div>
        </div>

        {assessments.length > 0 && (
          <div className="card">
            <div className="card-title mb-md">Previous Assessments</div>
            {assessments.slice(0, 5).map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>Score: {a.score}%</span>
                  <span className="text-secondary" style={{ marginLeft: '12px' }}>
                    Aptitude: {a.aptitude}% | Technical: {a.technical}% | Coding: {Math.round(a.coding)}%
                  </span>
                </div>
                <span className="text-secondary text-sm">{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (submitted && result) {
    const { assessment } = result;
    return (
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>✅ Assessment Complete!</h2>
        <p className="text-secondary mb-lg">Your personalized study plan has been generated</p>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon purple">📊</div><div className="stat-info"><h3>{assessment.score}%</h3><p>Overall Score</p></div></div>
          <div className="stat-card"><div className="stat-icon blue">🧠</div><div className="stat-info"><h3>{assessment.aptitude}%</h3><p>Aptitude</p></div></div>
          <div className="stat-card"><div className="stat-icon green">💻</div><div className="stat-info"><h3>{assessment.technical}%</h3><p>Technical</p></div></div>
          <div className="stat-card"><div className="stat-icon orange">⌨️</div><div className="stat-info"><h3>{Math.round(assessment.coding)}%</h3><p>Coding</p></div></div>
        </div>

        <div className="card mt-lg">
          <div className="card-title mb-md">Recommendations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assessment.aptitude < 60 && <div className="alert alert-warning">⚠️ Strengthen aptitude skills - practice quantitative and logical reasoning</div>}
            {assessment.technical < 60 && <div className="alert alert-warning">⚠️ Focus on core CS subjects - DSA, OS, DBMS, CN</div>}
            {assessment.coding < 60 && <div className="alert alert-warning">⚠️ Practice more coding problems on arrays, strings, and trees</div>}
            {assessment.score >= 60 && <div className="alert alert-success">✅ Good performance! Keep practicing to reach higher levels</div>}
          </div>
        </div>

        {/* ── Proctoring Violation Report ── */}
        <div className="card mt-lg" style={{ borderLeft: `4px solid ${level === 'safe' ? '#10b981' : level === 'warning' ? '#f59e0b' : '#ef4444'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="card-title">🎥 Proctoring Violation Report</div>
            <div style={{
              padding: '6px 16px',
              borderRadius: '20px',
              background: level === 'safe' ? 'rgba(16,185,129,0.12)' : level === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
              color: level === 'safe' ? '#10b981' : level === 'warning' ? '#f59e0b' : '#ef4444',
              fontWeight: 700,
              fontSize: '13px',
            }}>
              {level === 'safe' ? '🟢 Safe — No Issues' : level === 'warning' ? '🟡 Warning — Suspicious' : '🔴 Critical — Cheating Detected'}
            </div>
          </div>

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: violationCount <= 2 ? '#10b981' : violationCount <= 5 ? '#f59e0b' : '#ef4444' }}>{violationCount}</div>
              <div className="text-secondary" style={{ fontSize: '11px', fontWeight: 600 }}>Total Violations</div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {(() => { const cats = {}; violations.forEach(v => { cats[v.category] = (cats[v.category] || 0) + 1; }); return Object.keys(cats).length; })()}
              </div>
              <div className="text-secondary" style={{ fontSize: '11px', fontWeight: 600 }}>Categories Flagged</div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {level === 'safe' ? '✅' : level === 'warning' ? '⚠️' : '❌'}
              </div>
              <div className="text-secondary" style={{ fontSize: '11px', fontWeight: 600 }}>
                {level === 'safe' ? 'Passed' : level === 'warning' ? 'Review Needed' : 'Failed'}
              </div>
            </div>
          </div>

          {/* Detailed Violation Log */}
          {violationCount > 0 && violations.length > 0 ? (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Detailed Violation Log</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {violations.slice(0, 20).map((v, i) => (
                  <div key={i} style={{ 
                    fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', 
                    padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: '6px',
                    borderLeft: `3px solid ${v.category === 'Face' ? '#f59e0b' : v.category === 'System' ? '#ef4444' : v.category === 'Device' ? '#8b5cf6' : '#3b82f6'}`
                  }}>
                    <span style={{ fontSize: '16px' }}>{v.icon}</span>
                    <span style={{ flex: 1, fontWeight: 500 }}>{v.label}</span>
                    <span style={{ 
                      fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                      background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontWeight: 600
                    }}>{v.category}</span>
                    <span className="text-secondary" style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>{v.timestamp}</span>
                  </div>
                ))}
                {violations.length > 20 && (
                  <div className="text-secondary" style={{ fontSize: '11px', textAlign: 'center', marginTop: '4px' }}>
                    +{violations.length - 20} more violations recorded
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#10b981' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>No violations detected during this assessment!</div>
              <div className="text-secondary" style={{ fontSize: '12px', marginTop: '4px' }}>Great job maintaining exam integrity.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const sections = { aptitude: questions?.aptitude, technical: questions?.technical, coding: questions?.coding };
  const currentQuestions = sections[currentSection] || [];

  return (
    <div className="quiz-container">
      <div className="quiz-progress">
        <div style={{ flex: 1 }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(Object.keys(answers).length / 18) * 100}%` }} />
          </div>
        </div>
        <div className="quiz-progress-text">{Object.keys(answers).length}/17 answered</div>
        <div className={`quiz-timer ${timeLeft < 300 ? 'warning' : ''}`}>⏱ {formatTime(timeLeft)}</div>
      </div>

      <div className="filter-bar">
        {['aptitude', 'technical', 'coding'].map(s => (
          <button key={s} className={`filter-btn ${currentSection === s ? 'active' : ''}`} onClick={() => setCurrentSection(s)}>
            {s === 'aptitude' ? '🧠 Aptitude' : s === 'technical' ? '💻 Technical' : '⌨️ Coding'}
          </button>
        ))}
      </div>

      {currentSection !== 'coding' ? (
        currentQuestions.map((q, idx) => (
          <div key={q.id} className="question-card">
            <div className="question-number">Question {currentSection === 'technical' ? idx + 6 : idx + 1}</div>
            <div className="question-text">{q.question}</div>
            <div className="option-list">
              {q.options.map((opt, i) => (
                <div key={i} className={`option-item ${answers[q.id] === i ? 'selected' : ''}`} onClick={() => setAnswers({ ...answers, [q.id]: i })}>
                  <div className="option-radio" />
                  {opt}
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        currentQuestions[currentCodingIndex] && (
          <div className="assessment-coding-container">
            {/* Split Pane Layout */}
            <div className="assessment-coding-layout">
              {/* Left Panel: Problem Information */}
              <div className="assessment-problem-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="question-number">Coding Question {currentCodingIndex + 1}/2</span>
                  <span className={`tag ${currentQuestions[currentCodingIndex].difficulty === 'EASY' ? 'tag-green' : currentQuestions[currentCodingIndex].difficulty === 'MEDIUM' ? 'tag-orange' : 'tag-red'}`}>
                    {currentQuestions[currentCodingIndex].difficulty}
                  </span>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>{currentQuestions[currentCodingIndex].title}</h3>
                
                <div className="problem-description mb-lg" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px' }}>
                  {currentQuestions[currentCodingIndex].description}
                </div>

                {currentQuestions[currentCodingIndex].examples?.length > 0 && (
                  <div className="mb-lg">
                    <h4 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '15px' }}>Examples</h4>
                    {currentQuestions[currentCodingIndex].examples.map((ex, i) => (
                      <div key={i} className="example-box" style={{ marginBottom: '12px', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '13px' }}><strong>Input:</strong> <code>{ex.input}</code></div>
                        <div style={{ fontSize: '13px' }}><strong>Output:</strong> <code>{ex.output}</code></div>
                        {ex.explanation && <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}><strong>Explanation:</strong> {ex.explanation}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestions[currentCodingIndex].constraints && (
                  <div className="mb-lg">
                    <h4 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '15px' }}>Constraints</h4>
                    <pre style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '8px', borderRadius: '4px' }}>
                      {currentQuestions[currentCodingIndex].constraints}
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Panel: Editor and Results */}
              <div className="assessment-editor-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 8px' }}>
                  <select 
                    className="form-select" 
                    value={codingData[currentQuestions[currentCodingIndex].id]?.language || 'javascript'} 
                    onChange={e => updateCodingData(currentQuestions[currentCodingIndex].id, 'language', e.target.value)}
                    style={{ width: 'auto', padding: '4px 24px 4px 8px', fontSize: '12px' }}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                  </select>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => handleRunCode(currentQuestions[currentCodingIndex].id)}
                    disabled={codingData[currentQuestions[currentCodingIndex].id]?.running}
                  >
                    {codingData[currentQuestions[currentCodingIndex].id]?.running ? '⌛ Running...' : '▶ Run & Submit'}
                  </button>
                </div>

                <div className="monaco-wrapper" style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden', height: '400px' }}>
                  <Editor
                    height="100%"
                    language={codingData[currentQuestions[currentCodingIndex].id]?.language === 'cpp' ? 'cpp' : codingData[currentQuestions[currentCodingIndex].id]?.language}
                    value={codingData[currentQuestions[currentCodingIndex].id]?.code}
                    theme="vs-dark"
                    onChange={v => updateCodingData(currentQuestions[currentCodingIndex].id, 'code', v)}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      lineNumbers: 'on',
                    }}
                  />
                </div>

                {codingData[currentQuestions[currentCodingIndex].id]?.results && (
                  <div className="test-results mt-md" style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600 }}>Results:</span>
                      <span className={`tag ${codingData[currentQuestions[currentCodingIndex].id]?.status === 'ACCEPTED' ? 'tag-green' : 'tag-red'}`}>
                        {codingData[currentQuestions[currentCodingIndex].id]?.results.passedTests}/{codingData[currentQuestions[currentCodingIndex].id]?.results.totalTests} Passed
                      </span>
                    </div>
                    {codingData[currentQuestions[currentCodingIndex].id]?.results.results?.map((r, i) => (
                      <div key={i} className="mt-sm" style={{ 
                        fontSize: '11px', 
                        padding: '8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-primary)',
                        borderLeft: `3px solid ${r.passed ? 'var(--status-success)' : 'var(--status-error)'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: r.passed ? 'var(--status-success)' : 'var(--status-error)' }}>
                            {r.passed ? '✅ Passed' : '❌ Failed'} - Test Case {i + 1}
                          </span>
                          {r.timeMs !== undefined && <span className="text-secondary" style={{ fontSize: '9px' }}>{r.timeMs.toFixed(2)}ms</span>}
                        </div>
                        
                        {!r.passed && (
                          <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {r.actual?.includes('Error') || r.error ? (
                              <div style={{ color: 'var(--status-error)', fontWeight: 500 }}>
                                Error: <code style={{ whiteSpace: 'pre-wrap' }}>{r.actual || r.error}</code>
                              </div>
                            ) : (
                              <>
                                <div><span className="text-secondary">Input:</span> <code>{JSON.stringify(r.input)}</code></div>
                                <div><span className="text-secondary">Expected:</span> <code>{JSON.stringify(r.expected)}</code></div>
                                <div><span className="text-secondary">Actual:</span> <code style={{ color: 'var(--status-error)' }}>{JSON.stringify(r.actual)}</code></div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Sequential Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <div>
                {currentCodingIndex > 0 && (
                  <button className="btn btn-secondary" onClick={() => setCurrentCodingIndex(0)}>← Previous Problem</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {currentCodingIndex < 1 ? (
                  <button className="btn btn-secondary" onClick={() => setCurrentCodingIndex(1)}>Next Problem →</button>
                ) : (
                  <button className="btn btn-primary btn-lg" onClick={handleSubmit}>📤 Final Submit Assessment</button>
                )}
              </div>
            </div>
          </div>
        )
      )}
      <ProctoringOverlay
        violations={violations}
        violationCount={violationCount}
        level={level}
        proctorReady={proctorReady}
        lastViolation={lastViolation}
        videoRef={videoRef}
        detectionStats={detectionStats}
      />
    </div>
  );
}
