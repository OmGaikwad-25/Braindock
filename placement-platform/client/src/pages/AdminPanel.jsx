import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TOPIC_MAP = {
  'Verbal and Reasoning': ['Verbal Ability', 'Logical Reasoning', 'Verbal Reasoning', 'Non Verbal Reasoning'],
  'Interview': ['Placement Papers', 'Group Discussion', 'HR Interview'],
  'Technical MCQs': ['Computer Network', 'SQL', 'Operating System'],
  'Puzzles': ['Sudoku', 'Number puzzles', 'Missing letters puzzles', 'Logical puzzles', 'Clock puzzles'],
  'DSA': ['Arrays', 'String', 'Linked List', 'Stack', 'Queue', 'Trees', 'Heap', 'Hashing', 'Graphs', 'DP'],
  'General': ['General']
};

export default function AdminPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [problems, setProblems] = useState([]);
  const [mcqs, setMcqs] = useState([]);
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [showMCQForm, setShowMCQForm] = useState(false);
  const [problemForm, setProblemForm] = useState({ title: '', description: '', difficulty: 'EASY', topic: 'Arrays', constraints: '', tags: [], starterCode: { javascript: '', python: '', cpp: '', java: '' }, testCases: [{ input: {}, expectedOutput: '', isHidden: false }], examples: [{ input: '', output: '', explanation: '' }] });
  const [mcqForm, setMcqForm] = useState({ question: '', options: ['', '', '', ''], correct: 0, category: 'Verbal and Reasoning', topic: 'Verbal Ability', difficulty: 'EASY', explanation: '' });

  const [editProblemId, setEditProblemId] = useState(null);
  const [editMCQId, setEditMCQId] = useState(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') { setLoading(false); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    try {
      const [s, u, p, m] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/problems'),
        api.get('/admin/mcqs'),
      ]);
      setStats(s); setUsers(u); setProblems(p); setMcqs(m);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleRoleChange = async (userId, role) => {
    try { await api.put(`/admin/users/${userId}/role`, { role }); setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u)); } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try { await api.delete(`/admin/users/${userId}`); setUsers(prev => prev.filter(u => u.id !== userId)); } catch (err) { console.error(err); }
  };

  const saveProblem = async (e) => {
    e.preventDefault();
    try {
      // Process JSON fields
      const processedForm = {
        ...problemForm,
        testCases: problemForm.testCases.map(tc => ({
          ...tc,
          input: typeof tc.input === 'string' ? JSON.parse(tc.input) : tc.input,
          expectedOutput: typeof tc.expectedOutput === 'string' && (tc.expectedOutput.startsWith('[') || tc.expectedOutput.startsWith('{')) ? JSON.parse(tc.expectedOutput) : tc.expectedOutput
        }))
      };

      if (editProblemId) {
        await api.put(`/admin/problems/${editProblemId}`, processedForm);
      } else {
        await api.post('/admin/problems', processedForm);
      }
      setShowProblemForm(false);
      setEditProblemId(null);
      setProblemForm({ title: '', description: '', difficulty: 'EASY', topic: 'Arrays', constraints: '', tags: [], starterCode: { javascript: '', python: '', cpp: '', java: '' }, testCases: [{ input: {}, expectedOutput: '', isHidden: false }], examples: [{ input: '', output: '', explanation: '' }] });
      loadAll();
    } catch (err) { console.error('Save failed:', err); alert('Failed to save. Check JSON formatting in test cases.'); }
  };

  const editProblem = (p) => {
    setProblemForm({
      title: p.title,
      description: p.description,
      difficulty: p.difficulty,
      topic: p.topic,
      constraints: p.constraints || '',
      tags: p.tags || [],
      starterCode: p.starterCode || { javascript: '', python: '', cpp: '', java: '' },
      testCases: p.testCases || [{ input: {}, expectedOutput: '', isHidden: false }],
      examples: p.examples || [{ input: '', output: '', explanation: '' }]
    });
    setEditProblemId(p.id);
    setShowProblemForm(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProblem = async (id) => {
    if (!confirm('Delete problem?')) return;
    try { await api.delete(`/admin/problems/${id}`); loadAll(); } catch (err) { console.error(err); }
  };

  const saveMCQ = async (e) => {
    e.preventDefault();
    try {
      if (editMCQId) {
        await api.put(`/admin/mcqs/${editMCQId}`, mcqForm);
      } else {
        await api.post('/admin/mcqs', mcqForm);
      }
      setShowMCQForm(false);
      setEditMCQId(null);
      setMcqForm({ question: '', options: ['', '', '', ''], correct: 0, category: 'Verbal and Reasoning', topic: 'Verbal Ability', difficulty: 'EASY', explanation: '' });
      loadAll();
    } catch (err) { console.error(err); }
  };

  const editMCQ = (m) => {
    setMcqForm({
      question: m.question,
      options: m.options,
      correct: m.correct,
      category: m.category || 'Verbal and Reasoning',
      topic: m.topic,
      difficulty: m.difficulty,
      explanation: m.explanation || ''
    });
    setEditMCQId(m.id);
    setShowMCQForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteMCQ = async (id) => {
    if (!confirm('Delete MCQ?')) return;
    try { await api.delete(`/admin/mcqs/${id}`); loadAll(); } catch (err) { console.error(err); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading admin panel...</p></div>;
  if (user?.role !== 'ADMIN') return <div className="empty-state"><div className="empty-state-icon">🔒</div><h3>Admin Access Required</h3><p>Contact an administrator for access.</p></div>;

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>⚙️ Admin Panel</h2>
      <p className="text-secondary mb-lg">Manage users, questions, and system</p>

      <div className="filter-bar mb-lg">
        {['overview', 'users', 'coding', 'mcqs'].map(tab => (
          <button key={tab} className={`filter-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'overview' ? '📊 Overview' : tab === 'users' ? '👥 Users' : tab === 'coding' ? '💻 Coding' : '📝 MCQs'}
          </button>
        ))}
      </div>

      {/* ========== OVERVIEW ========== */}
      {activeTab === 'overview' && stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon purple">👥</div><div className="stat-info"><h3>{stats.totalUsers}</h3><p>Users</p></div></div>
            <div className="stat-card"><div className="stat-icon blue">💻</div><div className="stat-info"><h3>{stats.totalProblems}</h3><p>Coding Problems</p></div></div>
            <div className="stat-card"><div className="stat-icon green">📝</div><div className="stat-info"><h3>{stats.totalMCQs}</h3><p>MCQ Questions</p></div></div>
            <div className="stat-card"><div className="stat-icon orange">🎤</div><div className="stat-info"><h3>{stats.totalInterviews}</h3><p>Interviews</p></div></div>
          </div>
          <div className="card mt-lg">
            <div className="card-title mb-md">🆕 Recent Users</div>
            <div className="table-container">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                <tbody>
                  {stats.recentUsers?.map(u => (
                    <tr key={u.id}><td style={{fontWeight:600}}>{u.name}</td><td>{u.email}</td><td><span className={`tag ${u.role==='ADMIN'?'tag-red':'tag-blue'}`}>{u.role}</span></td><td>{new Date(u.createdAt).toLocaleDateString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========== USERS ========== */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-title mb-md">👥 All Users ({users.length})</div>
          <div className="table-container">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td><td style={{fontWeight:600}}>{u.name}</td><td>{u.email}</td>
                    <td><select className="form-select" value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} style={{width:'auto',padding:'4px 28px 4px 8px',fontSize:'12px'}}><option value="STUDENT">Student</option><option value="ADMIN">Admin</option><option value="RECRUITER">Recruiter</option></select></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(u.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== CODING PROBLEMS ========== */}
      {activeTab === 'coding' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontWeight: 700 }}>💻 Coding Problems ({problems.length})</h3>
            <button className="btn btn-primary" onClick={() => { setShowProblemForm(!showProblemForm); setEditProblemId(null); }}>
              {showProblemForm ? '✕ Cancel' : '+ Add Problem'}
            </button>
          </div>

          {showProblemForm && (
            <form onSubmit={saveProblem} className="card mb-lg">
              <div className="card-title mb-md">{editProblemId ? 'Edit Coding Problem' : 'New Coding Problem'}</div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={problemForm.title} onChange={e => setProblemForm({...problemForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={4} value={problemForm.description} onChange={e => setProblemForm({...problemForm, description: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-select" value={problemForm.difficulty} onChange={e => setProblemForm({...problemForm, difficulty: e.target.value})}>
                    <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Topic</label>
                  <input className="form-input" value={problemForm.topic} onChange={e => setProblemForm({...problemForm, topic: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Constraints</label>
                <textarea className="form-input" rows={2} value={problemForm.constraints} onChange={e => setProblemForm({...problemForm, constraints: e.target.value})} />
              </div>

              {/* Tags Section */}
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  {problemForm.tags.map(tag => (
                    <span key={tag} className="tag tag-blue" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {tag}
                      <button type="button" onClick={() => setProblemForm({...problemForm, tags: problemForm.tags.filter(t => t !== tag)})} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>✕</button>
                    </span>
                  ))}
                </div>
                <input 
                  className="form-input" 
                  placeholder="Type tag and press Enter..." 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      e.preventDefault();
                      if (!problemForm.tags.includes(e.target.value.trim())) {
                        setProblemForm({...problemForm, tags: [...problemForm.tags, e.target.value.trim()]});
                      }
                      e.target.value = '';
                    }
                  }} 
                />
              </div>

              {/* Starter Code Section */}
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                <div className="card-title mb-sm" style={{ fontSize: '14px' }}>💻 Starter Code</div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">JavaScript</label>
                    <textarea className="form-input" rows={3} style={{fontFamily:'monospace', fontSize: '12px'}} value={problemForm.starterCode.javascript} onChange={e => setProblemForm({...problemForm, starterCode: {...problemForm.starterCode, javascript: e.target.value}})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Python</label>
                    <textarea className="form-input" rows={3} style={{fontFamily:'monospace', fontSize: '12px'}} value={problemForm.starterCode.python} onChange={e => setProblemForm({...problemForm, starterCode: {...problemForm.starterCode, python: e.target.value}})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">C++</label>
                    <textarea className="form-input" rows={3} style={{fontFamily:'monospace', fontSize: '12px'}} value={problemForm.starterCode.cpp} onChange={e => setProblemForm({...problemForm, starterCode: {...problemForm.starterCode, cpp: e.target.value}})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Java</label>
                    <textarea className="form-input" rows={3} style={{fontFamily:'monospace', fontSize: '12px'}} value={problemForm.starterCode.java} onChange={e => setProblemForm({...problemForm, starterCode: {...problemForm.starterCode, java: e.target.value}})} />
                  </div>
                </div>
              </div>

              {/* Examples Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div className="card-title" style={{ fontSize: '16px' }}>📝 Examples (Shown to students)</div>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setProblemForm({...problemForm, examples: [...problemForm.examples, { input: '', output: '', explanation: '' }]})}>+ Add Example</button>
                </div>
                {problemForm.examples.map((ex, i) => (
                  <div key={i} className="card mb-md" style={{ background: 'var(--bg-tertiary)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>Example {i + 1}</span>
                      {problemForm.examples.length > 1 && <button type="button" className="text-danger" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }} onClick={() => setProblemForm({...problemForm, examples: problemForm.examples.filter((_, idx) => idx !== i)})}>Remove</button>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Input</label>
                      <input className="form-input" value={ex.input} onChange={e => {
                        const exs = [...problemForm.examples]; exs[i].input = e.target.value; setProblemForm({...problemForm, examples: exs});
                      }} placeholder="nums = [2,7,11,15], target = 9" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Output</label>
                      <input className="form-input" value={ex.output} onChange={e => {
                        const exs = [...problemForm.examples]; exs[i].output = e.target.value; setProblemForm({...problemForm, examples: exs});
                      }} placeholder="[0,1]" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Explanation</label>
                      <textarea className="form-input" rows={2} value={ex.explanation} onChange={e => {
                        const exs = [...problemForm.examples]; exs[i].explanation = e.target.value; setProblemForm({...problemForm, examples: exs});
                      }} placeholder="Because nums[0] + nums[1] == 9..." />
                    </div>
                  </div>
                ))}
              </div>

              {/* Test Cases Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div className="card-title" style={{ fontSize: '16px' }}>🧪 Test Cases (Execution)</div>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setProblemForm({...problemForm, testCases: [...problemForm.testCases, { input: {}, expectedOutput: '', isHidden: false }]})}>+ Add Test Case</button>
                </div>
                <div className="alert alert-info py-sm mb-md" style={{ fontSize: '12px' }}>Input must be valid JSON format, e.g., <code>{"{ \"nums\": [1,2], \"target\": 3 }"}</code></div>
                {problemForm.testCases.map((tc, i) => (
                  <div key={i} className="card mb-md" style={{ background: 'var(--bg-tertiary)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>Test Case {i + 1}</span>
                      {problemForm.testCases.length > 1 && <button type="button" className="text-danger" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }} onClick={() => setProblemForm({...problemForm, testCases: problemForm.testCases.filter((_, idx) => idx !== i)})}>Remove</button>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Input Object (JSON)</label>
                      <textarea className="form-input" rows={2} style={{fontFamily:'monospace', fontSize: '12px'}} value={typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input)} onChange={e => {
                        const tcs = [...problemForm.testCases]; tcs[i].input = e.target.value; setProblemForm({...problemForm, testCases: tcs});
                      }} placeholder='{"nums": [2,7,11,15], "target": 9}' />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Expected Output (JSON/Value)</label>
                      <input className="form-input" style={{fontFamily:'monospace', fontSize: '12px'}} value={typeof tc.expectedOutput === 'string' ? tc.expectedOutput : JSON.stringify(tc.expectedOutput)} onChange={e => {
                        const tcs = [...problemForm.testCases]; tcs[i].expectedOutput = e.target.value; setProblemForm({...problemForm, testCases: tcs});
                      }} placeholder="[0,1]" />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={tc.isHidden} onChange={e => {
                        const tcs = [...problemForm.testCases]; tcs[i].isHidden = e.target.checked; setProblemForm({...problemForm, testCases: tcs});
                      }} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Hidden Test Case (Not shown to student)</label>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ position: 'sticky', bottom: '20px', display: 'flex', gap: '12px', background: 'var(--bg-card)', padding: '16px 0', borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }}>💾 Save Problem</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProblemForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr><th>ID</th><th>Title</th><th>Difficulty</th><th>Topic</th><th>Actions</th></tr></thead>
                <tbody>
                  {problems.map((p, index) => (
                    <tr key={p.id}>
                      <td>{index + 1}</td><td style={{fontWeight:600}}>{p.title}</td>
                      <td><span className={`tag ${p.difficulty==='EASY'?'tag-green':p.difficulty==='MEDIUM'?'tag-orange':'tag-red'}`}>{p.difficulty}</span></td>
                      <td>{p.topic}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" onClick={() => editProblem(p)} title="Edit Problem">✏️</button>
                          <button className="btn-icon" onClick={() => deleteProblem(p.id)} title="Delete Problem">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== MCQ QUESTIONS ========== */}
      {activeTab === 'mcqs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontWeight: 700 }}>📝 MCQ Questions ({mcqs.length})</h3>
            <button className="btn btn-primary" onClick={() => setShowMCQForm(!showMCQForm)}>
              {showMCQForm ? '✕ Cancel' : '+ Add MCQ'}
            </button>
          </div>

          {showMCQForm && (
            <form onSubmit={saveMCQ} className="card mb-lg">
              <div className="card-title mb-md">{editMCQId ? 'Edit MCQ Question' : 'New MCQ Question'}</div>
              <div className="form-group">
                <label className="form-label">Question</label>
                <textarea className="form-input" rows={2} value={mcqForm.question} onChange={e => setMcqForm({...mcqForm, question: e.target.value})} required />
              </div>
              {mcqForm.options.map((opt, i) => (
                <div key={i} className="form-group">
                  <label className="form-label">Option {i + 1} {i === mcqForm.correct && '✅ (Correct)'}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="form-input" value={opt} onChange={e => { const opts = [...mcqForm.options]; opts[i] = e.target.value; setMcqForm({...mcqForm, options: opts}); }} required />
                    <button type="button" className={`btn btn-sm ${i === mcqForm.correct ? 'btn-success' : 'btn-secondary'}`} onClick={() => setMcqForm({...mcqForm, correct: i})}>✓</button>
                  </div>
                </div>
              ))}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category (Module)</label>
                  <select 
                    className="form-select" 
                    value={mcqForm.category} 
                    onChange={e => {
                      const newCat = e.target.value;
                      setMcqForm({
                        ...mcqForm, 
                        category: newCat, 
                        topic: TOPIC_MAP[newCat] ? TOPIC_MAP[newCat][0] : ''
                      });
                    }}
                  >
                    {Object.keys(TOPIC_MAP).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Topic (Sub-topic)</label>
                  <select 
                    className="form-select" 
                    value={mcqForm.topic} 
                    onChange={e => setMcqForm({...mcqForm, topic: e.target.value})}
                  >
                    {(TOPIC_MAP[mcqForm.category] || []).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-select" value={mcqForm.difficulty} onChange={e => setMcqForm({...mcqForm, difficulty: e.target.value})}>
                    <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Explanation</label>
                <textarea className="form-input" rows={2} value={mcqForm.explanation} onChange={e => setMcqForm({...mcqForm, explanation: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary">💾 Save MCQ</button>
            </form>
          )}

          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr><th>ID</th><th>Question</th><th>Topic</th><th>Difficulty</th><th>Actions</th></tr></thead>
                <tbody>
                  {mcqs.map((m, index) => (
                    <tr key={m.id}>
                      <td>{index + 1}</td><td style={{maxWidth:'300px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.question}</td>
                      <td><span className="tag tag-blue">{m.topic}</span></td>
                      <td><span className={`tag ${m.difficulty==='EASY'?'tag-green':m.difficulty==='MEDIUM'?'tag-orange':'tag-red'}`}>{m.difficulty}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" onClick={() => editMCQ(m)} title="Edit MCQ">✏️</button>
                          <button className="btn-icon" onClick={() => deleteMCQ(m.id)} title="Delete MCQ">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
