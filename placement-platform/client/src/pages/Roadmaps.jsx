import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Roadmaps() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(null);
  const [buying, setBuying] = useState(false);
  const [viewPlan, setViewPlan] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [maps, my] = await Promise.all([
        api.get('/roadmaps'),
        api.get('/roadmaps/my'),
      ]);
      setRoadmaps(maps);
      setPurchased(my);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const purchase = async (id) => {
    setBuying(true);
    try {
      await api.post(`/roadmaps/${id}/purchase`);
      await fetchData();
    } catch (err) { console.error(err); }
    setBuying(false);
  };

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading roadmaps...</p></div>;

  // If viewing a plan
  if (viewPlan) {
    const plan = viewPlan.plan || [];
    return (
      <div>
        <button className="btn btn-secondary mb-lg" onClick={() => setViewPlan(null)}>← Back to Roadmaps</button>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>📅 {viewPlan.title}</h2>
        <p className="text-secondary mb-lg">{viewPlan.duration}-Month Preparation Roadmap</p>

        {plan.map((month, mi) => (
          <div key={mi} className="card mb-lg">
            <div className="card-header">
              <div className="card-title">📆 Month {month.month}: {month.title}</div>
            </div>
            <div className="roadmap-weeks">
              {month.weeks?.map((week, wi) => (
                <div key={wi} className="roadmap-week">
                  <div className="roadmap-week-header">
                    <span className="tag tag-purple">Week {week.week}</span>
                    <span style={{ fontWeight: 700 }}>{week.focus}</span>
                  </div>
                  <div className="roadmap-tasks">
                    {week.tasks?.map((task, ti) => (
                      <div key={ti} className="roadmap-task-item">
                        <span className="roadmap-check">☐</span>
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>🗺️ Preparation Roadmaps</h2>
      <p className="text-secondary mb-lg">Choose your placement preparation journey</p>

      {purchased && (
        <div className="card mb-lg" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">✅ Active Plan: {purchased.roadmap?.title}</div>
              <p className="text-secondary text-sm mt-sm">Purchased on {new Date(purchased.purchasedAt).toLocaleDateString()}</p>
            </div>
            <button className="btn btn-primary" onClick={() => setViewPlan(purchased.roadmap)}>
              📖 View Full Roadmap
            </button>
          </div>
        </div>
      )}

      <div className="pricing-grid">
        {roadmaps.map((r, i) => (
          <div key={r.id} className={`pricing-card ${i === 1 ? 'featured' : ''}`}>
            {i === 1 && <div className="pricing-badge">Most Popular</div>}
            <div className="pricing-header">
              <div className="pricing-icon">{['🚀', '⭐', '👑'][i]}</div>
              <h3 className="pricing-title">{r.title}</h3>
              <p className="pricing-duration">{r.duration} Months</p>
              <div className="pricing-price">
                <span className="pricing-currency">₹</span>
                <span className="pricing-amount">{r.price}</span>
              </div>
            </div>
            <p className="text-secondary text-sm" style={{ marginBottom: '20px', lineHeight: '1.5' }}>{r.description}</p>
            <div className="pricing-features">
              {r.features?.map((f, fi) => (
                <div key={fi} className="pricing-feature">
                  <span className="pricing-feature-check">✓</span>
                  {f}
                </div>
              ))}
            </div>
            <div className="pricing-action">
              {r.isPurchased ? (
                <button className="btn btn-success btn-full" onClick={() => setViewPlan(r)}>📖 View Roadmap</button>
              ) : (
                <button className={`btn ${i === 1 ? 'btn-primary' : 'btn-secondary'} btn-full`} onClick={() => purchase(r.id)} disabled={buying}>
                  {buying ? 'Processing...' : `Get Started — ₹${r.price}`}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
