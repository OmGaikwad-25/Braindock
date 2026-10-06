import { useState, useEffect } from 'react';
import api from '../services/api';

export default function DailyTasks() {
  const [data, setData] = useState({ tasks: [], streak: 0 });
  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/tasks/daily'),
      api.get('/tasks/study-plan'),
    ]).then(([t, p]) => {
      setData(t);
      setStudyPlan(p);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const completeTask = async (id) => {
    try {
      await api.put(`/tasks/${id}/complete`);
      setData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === id ? { ...t, status: 'COMPLETED' } : t),
      }));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading tasks...</p></div>;

  const completed = data.tasks.filter(t => t.status === 'COMPLETED').length;
  const total = data.tasks.length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>✅ Daily Tasks</h2>
          <p className="text-secondary">Complete your daily tasks to build consistency</p>
        </div>
        {data.streak > 0 && (
          <div className="streak-badge">
            <span className="streak-fire">🔥</span> {data.streak} day streak
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="card mb-lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: 600 }}>Today's Progress</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{completed}/{total} completed</span>
        </div>
        <div className="progress-bar" style={{ height: '12px' }}>
          <div className={`progress-fill ${completed === total && total > 0 ? 'green' : ''}`} style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Toggle Study Plan */}
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={() => setShowPlan(!showPlan)}>
          📅 {showPlan ? 'Hide' : 'Show'} Study Plan
        </button>
      </div>

      {showPlan && studyPlan?.plan?.length > 0 && (
        <div className="mb-lg">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>📅 Your Weekly Study Plan</h3>
          {studyPlan.plan.map((day, i) => (
            <div key={i} className="plan-day">
              <div className="plan-day-header">📌 {day.day}</div>
              <div className="plan-day-tasks">
                {day.tasks?.map((task, j) => (
                  <div key={j} className="plan-task">
                    <div className="plan-task-type" style={{ background: task.type === 'CODING' ? 'var(--accent-primary-light)' : task.type === 'MCQ' ? 'var(--info-light)' : 'var(--success-light)' }}>
                      {task.type === 'CODING' ? '💻' : task.type === 'MCQ' ? '📝' : '📚'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{task.title}</div>
                      <div className="text-sm text-secondary">{task.topic} • {task.duration} • {task.difficulty}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task List */}
      {data.tasks.length > 0 ? (
        data.tasks.map(ut => (
          <div key={ut.id} className={`task-item ${ut.status === 'COMPLETED' ? 'completed' : ''}`} onClick={() => ut.status !== 'COMPLETED' && completeTask(ut.id)}>
            <div className={`task-checkbox ${ut.status === 'COMPLETED' ? 'checked' : ''}`}>
              {ut.status === 'COMPLETED' && '✓'}
            </div>
            <div className="task-content">
              <div className="task-title">{ut.task.title}</div>
              <div className="task-meta">
                <span className={`tag tag-${ut.task.difficulty === 'EASY' ? 'green' : ut.task.difficulty === 'MEDIUM' ? 'orange' : 'red'}`}>
                  {ut.task.difficulty}
                </span>
                <span className="tag tag-purple">{ut.task.type}</span>
                <span>{ut.task.topic}</span>
                <span>{ut.task.points} pts</span>
              </div>
              {ut.task.description && <p className="text-sm text-secondary mt-sm">{ut.task.description}</p>}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No tasks assigned yet</h3>
          <p>Complete your assessment first to get personalized daily tasks</p>
        </div>
      )}
    </div>
  );
}
