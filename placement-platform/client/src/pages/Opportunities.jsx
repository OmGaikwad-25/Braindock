import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOpportunities();
  }, [filter, search]);

  const fetchOpportunities = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('type', filter);
      if (search) params.set('search', search);
      const data = await api.get(`/opportunities?${params.toString()}`);
      setOpportunities(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading opportunities...</p></div>;

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>💼 Opportunities</h2>
      <p className="text-secondary mb-lg">Explore internships, placements, and events</p>

      <div className="filter-bar">
        {['ALL', 'INTERNSHIP', 'PLACEMENT', 'EVENT'].map(f => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'ALL' ? '🌐 All' : f === 'INTERNSHIP' ? '📚 Internships' : f === 'PLACEMENT' ? '💼 Placements' : '🎪 Events'}
          </button>
        ))}
        <input type="text" className="search-input" placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {opportunities.length > 0 ? (
        <div className="grid-auto">
          {opportunities.map(opp => (
            <div key={opp.id} className={`opportunity-card ${opp.type.toLowerCase()}`}>
              <div className="opp-header">
                <div>
                  <div className="opp-company">{opp.company}</div>
                  <div className="opp-role">{opp.role}</div>
                </div>
                <span className={`tag ${opp.type === 'INTERNSHIP' ? 'tag-purple' : opp.type === 'PLACEMENT' ? 'tag-green' : 'tag-orange'}`}>
                  {opp.type}
                </span>
              </div>
              <p className="text-secondary text-sm" style={{ marginBottom: '12px', lineHeight: '1.5' }}>{opp.description}</p>
              <div className="opp-details">
                {opp.location && <div className="opp-detail">📍 {opp.location}</div>}
                {opp.salary && <div className="opp-detail">💰 {opp.salary}</div>}
              </div>
              {opp.skills?.length > 0 && (
                <div className="tags-container mt-sm">
                  {opp.skills.map(s => <span key={s} className="tag tag-blue">{s}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No opportunities found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
}
