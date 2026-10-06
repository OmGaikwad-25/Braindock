import { useState, useEffect } from 'react';
import api from '../services/api';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading dashboard...</p></div>;

  const weeklyData = {
    labels: stats?.weeklyProgress?.map(d => d.date) || [],
    datasets: [{
      label: 'Tasks Completed',
      data: stats?.weeklyProgress?.map(d => d.completed) || [],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#6366f1',
    }],
  };

  const taskDoughnut = {
    labels: ['Completed', 'Pending'],
    datasets: [{
      data: [stats?.todayTasks?.completed || 0, Math.max((stats?.todayTasks?.total || 0) - (stats?.todayTasks?.completed || 0), 0)],
      backgroundColor: ['#6366f1', '#e2e8f0'],
      borderWidth: 0,
    }],
  };

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">📊</div>
          <div className="stat-info">
            <h3>{stats?.totalTasksCompleted || 0}</h3>
            <p>Tasks Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🔥</div>
          <div className="stat-info">
            <h3>{stats?.streak || 0}</h3>
            <p>Day Streak</p>
            {stats?.streak > 0 && <span className="streak-badge"><span className="streak-fire">🔥</span> {stats.streak} days</span>}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📝</div>
          <div className="stat-info">
            <h3>{stats?.totalTests || 0}</h3>
            <p>Tests Taken</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🎤</div>
          <div className="stat-info">
            <h3>{stats?.totalInterviews || 0}</h3>
            <p>Mock Interviews</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Weekly Progress</div>
              <div className="card-subtitle">Tasks completed this week</div>
            </div>
          </div>
          <div className="chart-container">
            <Line data={weeklyData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} height={200} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Today's Tasks</div>
              <div className="card-subtitle">{stats?.todayTasks?.completed || 0} of {stats?.todayTasks?.total || 0} completed</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ width: '160px' }}>
              <Doughnut data={taskDoughnut} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '65%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Tasks List */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">📋 Today's Tasks</div>
        </div>
        {stats?.todayTasks?.tasks?.length > 0 ? (
          stats.todayTasks.tasks.map(ut => (
            <div key={ut.id} className={`task-item ${ut.status === 'COMPLETED' ? 'completed' : ''}`}>
              <div className={`task-checkbox ${ut.status === 'COMPLETED' ? 'checked' : ''}`}>
                {ut.status === 'COMPLETED' && '✓'}
              </div>
              <div className="task-content">
                <div className="task-title">{ut.task.title}</div>
                <div className="task-meta">
                  <span className={`tag tag-${ut.task.difficulty === 'EASY' ? 'green' : ut.task.difficulty === 'MEDIUM' ? 'orange' : 'red'}`}>
                    {ut.task.difficulty}
                  </span>
                  <span>{ut.task.topic}</span>
                  <span>{ut.task.points} pts</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-secondary" style={{ padding: '12px 0' }}>No tasks assigned yet. Visit the Tasks page to get started!</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 Recent Tests</div>
          </div>
          {stats?.recentTests?.length > 0 ? (
            stats.recentTests.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
                <span className={`tag ${t.score >= 70 ? 'tag-green' : t.score >= 40 ? 'tag-orange' : 'tag-red'}`}>
                  {t.score}%
                </span>
              </div>
            ))
          ) : (
            <p className="text-secondary">No tests taken yet</p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🎤 Recent Interviews</div>
          </div>
          {stats?.recentInterviews?.length > 0 ? (
            stats.recentInterviews.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{i.type} Interview</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(i.createdAt).toLocaleDateString()}</div>
                </div>
                <span className={`tag ${i.score >= 70 ? 'tag-green' : i.score >= 40 ? 'tag-orange' : 'tag-red'}`}>
                  {i.score}%
                </span>
              </div>
            ))
          ) : (
            <p className="text-secondary">No interviews yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
