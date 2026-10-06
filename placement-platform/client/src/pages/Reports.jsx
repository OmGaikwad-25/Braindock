import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    api.get('/reports').then(setReports).catch(console.error).finally(() => setLoading(false));
  }, []);

  const generateReport = async (type) => {
    setGenerating(true);
    try {
      const report = await api.post('/reports/generate', { type });
      setReports(prev => [report, ...prev]);
      setSelectedReport(report);
    } catch (err) { console.error(err); }
    setGenerating(false);
  };

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading reports...</p></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>📑 Reports</h2>
          <p className="text-secondary">Generate and view performance reports</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => generateReport('weekly')} disabled={generating}>
            {generating ? '⏳ Generating...' : '📊 Weekly Report'}
          </button>
          <button className="btn btn-secondary" onClick={() => generateReport('monthly')} disabled={generating}>
            📅 Monthly Report
          </button>
        </div>
      </div>

      {selectedReport && (
        <div className="card mb-lg" style={{ animation: 'alertIn 0.3s ease-out' }}>
          <div className="card-header">
            <div className="card-title">📊 {selectedReport.title}</div>
            <button className="btn-icon" onClick={() => setSelectedReport(null)}>✕</button>
          </div>

          {(() => {
            const d = selectedReport.data || {};
            return (
              <>
                <div className="stats-grid mb-md">
                  <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-info"><h3>{d.tasks?.rate || 0}%</h3><p>Task Completion</p></div></div>
                  <div className="stat-card"><div className="stat-icon blue">📝</div><div className="stat-info"><h3>{d.tests?.avgScore || 0}%</h3><p>Avg Test Score</p></div></div>
                  <div className="stat-card"><div className="stat-icon purple">🎤</div><div className="stat-info"><h3>{d.interviews?.avgScore || 0}%</h3><p>Avg Interview</p></div></div>
                </div>

                <div className="grid-2 mb-md">
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>📊 Task Summary</h4>
                    <div className="report-metric"><span>Completed</span><span style={{ fontWeight: 700 }}>{d.tasks?.completed || 0}</span></div>
                    <div className="report-metric"><span>Total Assigned</span><span style={{ fontWeight: 700 }}>{d.tasks?.total || 0}</span></div>
                    <div className="report-metric"><span>Tests Taken</span><span style={{ fontWeight: 700 }}>{d.tests?.count || 0}</span></div>
                    <div className="report-metric"><span>Interviews Done</span><span style={{ fontWeight: 700 }}>{d.interviews?.count || 0}</span></div>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>💪 Strengths</h4>
                    <div className="tags-container mb-md">
                      {d.strengths?.map(s => <span key={s} className="tag tag-green">✅ {s}</span>) || <span className="text-secondary">None identified yet</span>}
                    </div>
                    <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>⚠️ Weaknesses</h4>
                    <div className="tags-container">
                      {d.weaknesses?.map(w => <span key={w} className="tag tag-orange">⚠️ {w}</span>) || <span className="text-secondary">None identified</span>}
                    </div>
                  </div>
                </div>

                <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>🤖 Recommendations</h4>
                {d.recommendations?.map((r, i) => (
                  <div key={i} className="alert alert-info">💡 {r}</div>
                ))}
              </>
            );
          })()}
        </div>
      )}

      {/* Report List */}
      {reports.length > 0 ? (
        <div className="card">
          <div className="card-title mb-md">📋 Report History</div>
          {reports.map(r => (
            <div key={r.id} className="task-item" onClick={() => setSelectedReport(r)}>
              <div style={{ fontSize: '24px' }}>📄</div>
              <div className="task-content">
                <div className="task-title">{r.title}</div>
                <div className="task-meta">
                  <span className={`tag ${r.type === 'weekly' ? 'tag-purple' : 'tag-blue'}`}>{r.type}</span>
                  <span>{new Date(r.generatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <span className="text-secondary">→</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No reports generated yet</h3>
          <p>Click the button above to generate your first performance report</p>
        </div>
      )}
    </div>
  );
}
