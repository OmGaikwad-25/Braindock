import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import api from '../services/api';

export default function CodingPlatform() {
  const [problems, setProblems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [showSubs, setShowSubs] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const editorRef = useRef(null);

  useEffect(() => {
    api.get('/coding').then(setProblems).catch(console.error).finally(() => setLoading(false));
  }, []);

  const selectProblem = async (id) => {
    try {
      const p = await api.get(`/coding/${id}`);
      setSelected(p);
      setCode(p.starterCode?.[language] || '// Write your code here\n');
      setResults(null);
      setShowSubs(false);
      // Load submissions
      const subs = await api.get(`/coding/${id}/submissions`);
      setSubmissions(subs);
    } catch (err) { console.error(err); }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (selected?.starterCode?.[lang]) {
      setCode(selected.starterCode[lang]);
    } else {
      let commentPrefix = lang === 'python' ? '#' : '//';
      setCode(`${commentPrefix} Write your ${lang} code here\n`);
    }
  };

  const runCode = async () => {
    setRunning(true);
    try {
      const res = await api.post(`/coding/${selected.id}/submit`, { code, language });
      setResults(res);
      // Refresh problem list
      const probs = await api.get('/coding');
      setProblems(probs);
    } catch (err) { console.error(err); }
    setRunning(false);
  };

  // Compute Tag Counts
  const tagCounts = {};
  problems.forEach(p => {
    const tagsToCount = p.tags && p.tags.length > 0 ? p.tags : (p.topic ? [p.topic] : []);
    tagsToCount.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const displayTags = showAllTags ? sortedTags : sortedTags.slice(0, 10);

  let filteredProblems = problems;
  if (filter !== 'ALL') filteredProblems = filteredProblems.filter(p => p.difficulty === filter);
  if (selectedTag) {
    filteredProblems = filteredProblems.filter(p => {
      const pTags = p.tags && p.tags.length > 0 ? p.tags : (p.topic ? [p.topic] : []);
      return pTags.includes(selectedTag);
    });
  }

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading problems...</p></div>;

  if (!selected) {
    return (
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>💻 Coding Platform</h2>
        <p className="text-secondary mb-lg">Practice coding problems like LeetCode</p>

        <div className="filter-bar mb-lg">
          {['ALL', 'EASY', 'MEDIUM', 'HARD'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? '🌐 All' : f === 'EASY' ? '🟢 Easy' : f === 'MEDIUM' ? '🟡 Medium' : '🔴 Hard'}
            </button>
          ))}
        </div>

        {/* LeetCode-Style Topic Tags Cloud */}
        {sortedTags.length > 0 && (
          <div className="card mb-lg pb-md" style={{ padding: '16px', background: 'var(--bg-tertiary)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {displayTags.map(([tag, count]) => (
                <div 
                  key={tag} 
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  style={{ 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', 
                    backgroundColor: selectedTag === tag ? 'var(--accent-primary)' : 'var(--bg-primary)', 
                    color: selectedTag === tag ? '#fff' : 'var(--text-primary)', 
                    borderRadius: '20px', padding: '4px 12px', fontSize: '13px', 
                    border: selectedTag === tag ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    transition: 'all 0.2s ease', userSelect: 'none'
                  }}
                >
                  {tag} 
                  <span style={{ 
                    marginLeft: '6px', 
                    backgroundColor: selectedTag === tag ? 'rgba(255,255,255,0.2)' : 'var(--border-light)', 
                    padding: '2px 8px', borderRadius: '10px', fontSize: '11px', 
                    color: selectedTag === tag ? '#fff' : 'var(--text-secondary)' 
                  }}>{count}</span>
                </div>
              ))}
              {sortedTags.length > 10 && (
                <button 
                  style={{ 
                    background: 'none', border: 'none', cursor: 'pointer', 
                    fontSize: '13px', color: 'var(--accent-primary)', marginLeft: '8px', 
                    padding: '4px 8px', fontWeight: 600, transition: 'opacity 0.2s'
                  }} 
                  onClick={() => setShowAllTags(!showAllTags)}
                  onMouseOver={(e) => e.target.style.opacity = '0.8'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  {showAllTags ? 'Collapse ︽' : 'Expand ︾'}
                </button>
              )}
            </div>
            {selectedTag && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Filtering by topic: <strong style={{ color: 'var(--accent-primary)' }}>{selectedTag}</strong>
                <button style={{ marginLeft: '12px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }} onClick={() => setSelectedTag(null)}>Clear filter</button>
              </div>
            )}
          </div>
        )}

        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr><th style={{width:'50px'}}>Status</th><th>Title</th><th>Difficulty</th><th>Topic</th><th>Tags</th></tr>
              </thead>
              <tbody>
                {filteredProblems.map(p => (
                  <tr key={p.id} className="clickable-row" onClick={() => selectProblem(p.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ textAlign: 'center', fontSize: '16px' }}>
                      {p.status === 'ACCEPTED' ? '✅' : p.status === 'WRONG_ANSWER' ? '❌' : '⬜'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.title}</td>
                    <td>
                      <span className={`tag ${p.difficulty === 'EASY' ? 'tag-green' : p.difficulty === 'MEDIUM' ? 'tag-orange' : 'tag-red'}`}>{p.difficulty}</span>
                    </td>
                    <td>{p.topic}</td>
                    <td>
                      <div className="tags-container">{p.tags?.map(t => <span key={t} className="tag tag-blue" style={{fontSize:'11px'}}>{t}</span>)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="coding-layout">
      {/* Left Panel - Problem Description */}
      <div className="coding-problem-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>← Back</button>
          <span className={`tag ${selected.difficulty === 'EASY' ? 'tag-green' : selected.difficulty === 'MEDIUM' ? 'tag-orange' : 'tag-red'}`}>{selected.difficulty}</span>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>{selected.title}</h2>

        <div className="tags-container mb-md">
          {selected.tags?.map(t => <span key={t} className="tag tag-blue">{t}</span>)}
        </div>

        <div className="problem-description" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', marginBottom: '20px', fontSize: '14px' }}>
          {selected.description}
        </div>

        {selected.examples?.length > 0 && (
          <div className="mb-lg">
            <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Examples</h4>
            {selected.examples.map((ex, i) => (
              <div key={i} className="example-box">
                <div><strong>Input:</strong> <code>{ex.input}</code></div>
                <div><strong>Output:</strong> <code>{ex.output}</code></div>
                {ex.explanation && <div><strong>Explanation:</strong> {ex.explanation}</div>}
              </div>
            ))}
          </div>
        )}

        {selected.constraints && (
          <div className="mb-lg">
            <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Constraints</h4>
            <pre className="constraints-box">{selected.constraints}</pre>
          </div>
        )}

        {/* Submissions */}
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSubs(!showSubs)}>
            📋 {showSubs ? 'Hide' : 'Show'} Submissions ({submissions.length})
          </button>
          {showSubs && submissions.length > 0 && (
            <div className="mt-md">
              {submissions.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                  <span className={`tag ${s.status === 'ACCEPTED' ? 'tag-green' : 'tag-red'}`}>{s.status}</span>
                  <span>{s.language}</span>
                  <span>{s.passedTests}/{s.totalTests} tests</span>
                  <span className="text-secondary">{new Date(s.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Code Editor */}
      <div className="coding-editor-panel">
        <div className="editor-toolbar">
          <select className="form-select" value={language} onChange={e => handleLanguageChange(e.target.value)} style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '13px' }}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={runCode} disabled={running}>
              {running ? '⏳ Running...' : '▶ Run & Submit'}
            </button>
          </div>
        </div>

        <div className="monaco-wrapper">
          <Editor
            height="55vh"
            language={language === 'cpp' ? 'cpp' : language}
            value={code}
            onChange={v => setCode(v)}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
            onMount={(editor) => { editorRef.current = editor; }}
          />
        </div>

        {/* Results Panel */}
        {results && (
          <div className="test-results">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontWeight: 700 }}>
                {results.status === 'ACCEPTED' ? '✅ All Tests Passed!' : `❌ ${results.passedTests}/${results.totalTests} Tests Passed`}
              </h4>
              <span className={`tag ${results.status === 'ACCEPTED' ? 'tag-green' : 'tag-red'}`}>{results.status}</span>
            </div>

            {results.results?.map((r, i) => (
              <div key={i} className={`test-case-result ${r.passed ? 'passed' : 'failed'}`}>
                <div className="test-case-header">
                  <span>{r.passed ? '✅' : '❌'} Test Case {i + 1}</span>
                </div>
                <div className="test-case-body">
                  <div><strong>Input:</strong> <code>{JSON.stringify(r.input)}</code></div>
                  <div><strong>Expected:</strong> <code>{JSON.stringify(r.expected)}</code></div>
                  <div><strong>Output:</strong> <code>{JSON.stringify(r.actual)}</code></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
