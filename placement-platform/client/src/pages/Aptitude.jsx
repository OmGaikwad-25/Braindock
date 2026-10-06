import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Aptitude() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.get('/aptitude/categories');
      setModules(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const startPractice = async (topic) => {
    setLoading(true);
    try {
      const data = await api.get(`/aptitude/questions?topic=${topic}`);
      setQuestions(data);
      setSelectedTopic(topic);
      setCurrentIdx(0);
      setScore(0);
      setCompleted(false);
      setSelectedOption(null);
      setShowExplanation(false);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAnswer = (idx) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === questions[currentIdx].correct) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(c => c + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setCompleted(true);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading Aptitude...</p></div>;

  // Level 3: Practice Session
  if (selectedTopic && !completed) {
    const q = questions[currentIdx];
    return (
      <div className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button className="btn btn-secondary" onClick={() => setSelectedTopic(null)}>← Back to {selectedModule?.name}</button>
          <div className="tag tag-purple">{selectedTopic} • {currentIdx + 1}/{questions.length}</div>
        </div>

        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', lineHeight: 1.4 }}>{q.question}</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {q.options.map((opt, i) => {
              let style = { textAlign: 'left', padding: '16px', justifyContent: 'flex-start', border: '1px solid var(--border-light)', borderRadius: '12px', transition: 'all 0.2s' };
              
              if (selectedOption !== null) {
                if (i === q.correct) {
                  style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                  style.borderColor = 'var(--success)';
                  style.color = 'var(--success)';
                } else if (i === selectedOption) {
                  style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  style.borderColor = 'var(--danger)';
                  style.color = 'var(--danger)';
                }
              }

              return (
                <button 
                  key={i} 
                  className="filter-btn"
                  style={style}
                  onClick={() => handleAnswer(i)}
                >
                  <span style={{ fontWeight: 700, marginRight: '12px', opacity: 0.6 }}>{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="alert alert-info mt-lg fade-in">
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>💡 Explanation</div>
              <p style={{ fontSize: '14px', lineHeight: 1.5 }}>{q.explanation}</p>
              <button className="btn btn-primary mt-md" style={{ width: '100%' }} onClick={nextQuestion}>
                {currentIdx + 1 === questions.length ? 'Finish' : 'Next Question →'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-state-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>🏆</div>
        <h3>Practice Completed!</h3>
        <p>You scored <strong>{score}</strong> out of <strong>{questions.length}</strong> in {selectedTopic}.</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={() => startPractice(selectedTopic)}>Try Again</button>
          <button className="btn btn-secondary" onClick={() => { setSelectedTopic(null); setCompleted(false); }}>Other Topics</button>
        </div>
      </div>
    );
  }

  // Level 2: Sub-topics within a Module
  if (selectedModule) {
    return (
      <div className="fade-in">
        <div className="header-flex mb-lg">
          <button className="btn btn-sm btn-secondary" onClick={() => setSelectedModule(null)}>← All Modules</button>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>{selectedModule.icon} {selectedModule.name}</h2>
            <p className="text-secondary">Select a sub-topic to practice</p>
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {selectedModule.topics.map(topic => (
            <div key={topic.name} className="card hover-card" style={{ cursor: 'pointer' }} onClick={() => startPractice(topic.name)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{topic.name}</h3>
                <div className="tag tag-blue">{topic.count} Questions</div>
              </div>
              <p className="text-secondary mt-sm" style={{ fontSize: '13px' }}>Practice {topic.name} to improve your skills.</p>
              <button className="btn btn-sm btn-secondary mt-md" style={{ width: '100%' }}>Start →</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Level 1: Module Cards
  return (
    <div className="fade-in">
      <div className="header-flex mb-lg">
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800 }}>🧠 Aptitude Preparation</h2>
          <p className="text-secondary">Master quantitative, logical, verbal, and technical reasoning</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {modules.map(mod => (
          <div key={mod.name} className="card hover-card" style={{ cursor: 'pointer', padding: '24px' }} onClick={() => setSelectedModule(mod)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="stat-icon purple" style={{ fontSize: '32px', width: '64px', height: '64px', borderRadius: '16px' }}>{mod.icon}</div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{mod.name}</h3>
                <p className="text-secondary mt-sm" style={{ fontSize: '14px' }}>{mod.topics?.length || 0} Topics available</p>
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {mod.topics?.slice(0, 3).map(t => (
                <span key={t.name} className="tag tag-gray" style={{ fontSize: '11px' }}>{t.name}</span>
              ))}
              {mod.topics?.length > 3 && <span className="tag tag-gray" style={{ fontSize: '11px' }}>+{mod.topics.length - 3} more</span>}
            </div>
            <button className="btn btn-primary mt-lg" style={{ width: '100%' }}>Explore Module →</button>
          </div>
        ))}

        {modules.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3>No Modules Found</h3>
            <p className="text-secondary">Please add categorised MCQs from the Admin Panel.</p>
          </div>
        )}
      </div>

      <div className="card mt-xl" style={{ border: 'none', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ fontSize: '48px' }}>🚀</div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 700 }}>Placement Readiness Tip</h3>
            <p style={{ opacity: 0.9, marginTop: '8px', fontSize: '15px' }}>Top companies value consistency. Solve at least 5 aptitude and 1 coding problem daily to stay ahead of the curve.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
