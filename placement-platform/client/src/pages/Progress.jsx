import { useState, useEffect } from 'react';
import api from '../services/api';
import { Line, Radar, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

export default function Progress() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/analytics').then(setAnalytics).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading analytics...</p></div>;

  if (!analytics) return <div className="empty-state"><div className="empty-state-icon">📊</div><h3>No data yet</h3><p>Complete tasks and take tests to see your progress</p></div>;

  const testChart = {
    labels: analytics.testTrend?.map(t => t.date) || [],
    datasets: [{
      label: 'Test Score',
      data: analytics.testTrend?.map(t => t.score) || [],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const radarData = {
    labels: analytics.topicScores?.map(t => t.topic) || [],
    datasets: [{
      label: 'Score %',
      data: analytics.topicScores?.map(t => t.score) || [],
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: '#6366f1',
      pointBackgroundColor: '#6366f1',
    }],
  };

  const taskTypeData = {
    labels: Object.keys(analytics.tasksByType || {}),
    datasets: [
      { label: 'Completed', data: Object.values(analytics.tasksByType || {}).map(t => t.completed), backgroundColor: '#10b981' },
      { label: 'Total', data: Object.values(analytics.tasksByType || {}).map(t => t.total), backgroundColor: '#e2e8f0' },
    ],
  };

  const interviewChart = {
    labels: analytics.interviewTrend?.map(t => t.date) || [],
    datasets: [{
      label: 'Interview Score',
      data: analytics.interviewTrend?.map(t => t.score) || [],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>📈 Progress Tracking</h2>
      <p className="text-secondary mb-lg">Track your improvement across all areas</p>

      {/* Overall Stats */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon purple">📊</div><div className="stat-info"><h3>{analytics.overallStats?.completionRate || 0}%</h3><p>Task Completion Rate</p></div></div>
        <div className="stat-card"><div className="stat-icon blue">📝</div><div className="stat-info"><h3>{analytics.overallStats?.avgTestScore || 0}%</h3><p>Avg Test Score</p></div></div>
        <div className="stat-card"><div className="stat-icon green">🎤</div><div className="stat-info"><h3>{analytics.overallStats?.avgInterviewScore || 0}%</h3><p>Avg Interview Score</p></div></div>
        <div className="stat-card"><div className="stat-icon orange">✅</div><div className="stat-info"><h3>{analytics.overallStats?.completedTasks || 0}</h3><p>Total Completed</p></div></div>
      </div>

      {/* Charts */}
      <div className="grid-2 mb-lg">
        <div className="card">
          <div className="card-header"><div className="card-title">📊 Test Score Trend</div></div>
          <div className="chart-container" style={{ height: '250px' }}>
            {analytics.testTrend?.length > 0 ? <Line data={testChart} options={chartOpts} /> : <p className="text-secondary text-center">No test data yet</p>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">🎯 Skill Radar</div></div>
          <div className="chart-container" style={{ height: '250px' }}>
            {analytics.topicScores?.length > 0 ? <Radar data={radarData} options={{ ...chartOpts, scales: { r: { beginAtZero: true, max: 100 } } }} /> : <p className="text-secondary text-center">No topic data yet</p>}
          </div>
        </div>
      </div>

      <div className="grid-2 mb-lg">
        <div className="card">
          <div className="card-header"><div className="card-title">📋 Tasks by Type</div></div>
          <div className="chart-container" style={{ height: '250px' }}>
            {Object.keys(analytics.tasksByType || {}).length > 0 ? <Bar data={taskTypeData} options={chartOpts} /> : <p className="text-secondary text-center">No task data</p>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">🎤 Interview Score Trend</div></div>
          <div className="chart-container" style={{ height: '250px' }}>
            {analytics.interviewTrend?.length > 0 ? <Line data={interviewChart} options={chartOpts} /> : <p className="text-secondary text-center">No interview data yet</p>}
          </div>
        </div>
      </div>

      {/* AI Readiness Assessment */}
      {analytics.aiAnalysis && (
        <div className="card mb-lg" style={{ borderTop: '4px solid var(--accent-primary)' }}>
          <div className="card-title mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🤖</span> AI Readiness Assessment
          </div>
          
          <div className="grid-3 mb-md">
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
              <p className="text-secondary mb-sm font-bold">Readiness Score</p>
              <h2 style={{ fontSize: '36px', margin: 0, color: 'var(--accent-primary)' }}>{analytics.aiAnalysis.readinessScore}/100</h2>
              <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>{analytics.aiAnalysis.level}</p>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
              <p className="text-secondary mb-sm font-bold">Learning Velocity</p>
              <h2 style={{ fontSize: '36px', margin: 0, color: analytics.aiAnalysis.learningVelocity === 'ACCELERATING' ? 'var(--success)' : analytics.aiAnalysis.learningVelocity === 'STEADY' ? 'var(--info)' : 'var(--warning)' }}>
                {analytics.aiAnalysis.learningVelocity === 'ACCELERATING' ? '🚀' : analytics.aiAnalysis.learningVelocity === 'STEADY' ? '➡️' : '📉'}
              </h2>
              <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>{analytics.aiAnalysis.learningVelocity}</p>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
              <p className="text-secondary mb-sm font-bold">Top Strength</p>
              <h2 style={{ fontSize: '28px', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '42px' }}>
                {analytics.aiAnalysis.strengths[0] ? '🌟' : '⏳'}
              </h2>
              <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>
                {analytics.aiAnalysis.strengths[0] || 'Keep learning!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses (AI Enhanced) */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title mb-md">💪 AI-Identified Strengths</div>
          {analytics.aiAnalysis?.strengths?.length > 0 ? (
            <div className="tags-container">{analytics.aiAnalysis.strengths.map(s => <span key={s} className="tag tag-green">✅ {s}</span>)}</div>
          ) : <p className="text-secondary">Take more tests to identify strengths</p>}
        </div>
        <div className="card">
          <div className="card-title mb-md">🎯 High-Priority Focus Areas</div>
          {analytics.aiAnalysis?.weaknesses?.length > 0 ? (
            <div className="tags-container">{analytics.aiAnalysis.weaknesses.map(w => <span key={w} className="tag tag-orange">⚠️ {w}</span>)}</div>
          ) : <p className="text-secondary">No weaknesses identified yet</p>}
        </div>
      </div>

      {/* AI Suggestions */}
      {analytics.suggestions?.length > 0 && (
        <div className="card mt-lg">
          <div className="card-title mb-md">🤖 Personalized Action Plan</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analytics.suggestions.map((s, i) => (
              <div key={i} className="alert alert-info" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '18px' }}>💡</span>
                <span style={{ fontWeight: 500 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
