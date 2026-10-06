import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Profile() {
  const [profile, setProfile] = useState({ branch: 'Computer Engineering', year: 3, cgpa: 0, skills: [], targetCompanies: [], careerGoals: '', user: null, submissions: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    api.get('/profile').then(p => {
      setProfile({
        branch: p.branch || 'Computer Engineering', year: p.year || 3, cgpa: p.cgpa || 0,
        skills: p.skills || [], targetCompanies: p.targetCompanies || [], careerGoals: p.careerGoals || '',
        user: p.user || null, submissions: p.submissions || []
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profile', profile);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Failed to update profile.'); }
    setSaving(false);
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!profile.skills.includes(skillInput.trim())) setProfile({ ...profile, skills: [...profile.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });

  const addCompany = (e) => {
    if (e.key === 'Enter' && companyInput.trim()) {
      e.preventDefault();
      if (!profile.targetCompanies.includes(companyInput.trim())) setProfile({ ...profile, targetCompanies: [...profile.targetCompanies, companyInput.trim()] });
      setCompanyInput('');
    }
  };

  const removeCompany = (c) => setProfile({ ...profile, targetCompanies: profile.targetCompanies.filter(x => x !== c) });

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading profile...</p></div>;

  // Calendar logic
  const today = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const currentMonthSubmissions = profile.submissions.filter(s => {
    const d = new Date(s.createdAt);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  });
  const activeDays = new Set(currentMonthSubmissions.map(s => new Date(s.createdAt).getDate()));

  const calendarGrid = [];
  for (let i = 0; i < firstDay; i++) calendarGrid.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarGrid.push(i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} left`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getInitials = (name) => name ? name.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>My Profile</h2>
      <p className="text-secondary mb-lg">Complete your profile to get personalized recommendations</p>
      {message && <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Forms */}
        <form onSubmit={handleSave} style={{ width: '100%' }}>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title mb-md">📚 Academic Details</div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Branch</label>
                <select className="form-select" value={profile.branch} onChange={e => setProfile({ ...profile, branch: e.target.value })}>
                  <option>Computer Engineering</option><option>Information Technology</option><option>Electronics & Telecom</option><option>Mechanical Engineering</option><option>Civil Engineering</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <select className="form-select" value={profile.year} onChange={e => setProfile({ ...profile, year: parseInt(e.target.value) })}>
                  <option value={1}>1st Year</option><option value={2}>2nd Year</option><option value={3}>3rd Year</option><option value={4}>4th Year</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">CGPA</label>
              <input type="number" className="form-input" step="0.01" min="0" max="10" value={profile.cgpa} onChange={e => setProfile({ ...profile, cgpa: e.target.value })} placeholder="8.5" />
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title mb-md">💻 Skills</div>
            <div className="tag-input-container" onClick={() => document.getElementById('skill-input')?.focus()}>
              {profile.skills.map(s => <span key={s} className="tag-removable">{s}<button type="button" className="tag-remove" onClick={() => removeSkill(s)}>✕</button></span>)}
              <input id="skill-input" type="text" placeholder="Type a skill and press Enter..." value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill} />
            </div>
            <p className="text-sm text-secondary mt-sm">e.g., Python, Java, DSA, Machine Learning, React, SQL</p>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title mb-md">🎯 Target Companies</div>
            <div className="tag-input-container" onClick={() => document.getElementById('company-input')?.focus()}>
              {profile.targetCompanies.map(c => <span key={c} className="tag-removable">{c}<button type="button" className="tag-remove" onClick={() => removeCompany(c)}>✕</button></span>)}
              <input id="company-input" type="text" placeholder="Type a company name and press Enter..." value={companyInput} onChange={e => setCompanyInput(e.target.value)} onKeyDown={addCompany} />
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title mb-md">🚀 Career Goals</div>
            <div className="form-group">
              <textarea className="form-input" rows={3} placeholder="Describe your career goals..." value={profile.careerGoals} onChange={e => setProfile({ ...profile, careerGoals: e.target.value })} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Profile'}
          </button>
        </form>

        {/* Right Side: Avatar & Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Avatar Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', textAlign: 'center' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 700, marginBottom: '16px', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              {getInitials(profile.user?.name)}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>{profile.user?.name || 'Student'}</h3>
            <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '16px' }}>@{profile.user?.name?.replace(/\s+/g, '').toLowerCase() || 'coder'}</p>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Edit Profile</button>
          </div>

          {/* Activity Calendar Card */}
          <div className="card" style={{ position: 'relative' }}>
            {/* Hexagon Badge */}
            <div style={{ 
              position: 'absolute', top: '-15px', right: '20px', width: '50px', height: '58px', 
              backgroundColor: 'var(--bg-tertiary)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', zIndex: 2
            }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>{today.getDate()}</span>
              <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{today.toLocaleString('default', { month: 'short' })}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Day {today.getDate()}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{timeLeft}</div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={prevMonth} className="btn-icon">‹</button>
                <button onClick={nextMonth} className="btn-icon">›</button>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            
            {/* Days Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '12px', color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 600 }}>
              {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
              {calendarGrid.map((day, idx) => {
                const isActive = activeDays.has(day);
                const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
                
                return (
                  <div key={idx} style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                    height: '36px', 
                    borderRadius: isToday ? '50%' : '4px',
                    backgroundColor: isToday ? (isActive ? 'var(--success)' : 'var(--accent-primary)') : 'transparent',
                    color: isToday ? '#fff' : 'var(--text-primary)',
                    fontSize: '13px'
                  }}>
                    {day ? (
                      <>
                        <span style={{ lineHeight: '1' }}>{day}</span>
                        {/* Status Dot */}
                        <div style={{ 
                          width: '4px', height: '4px', borderRadius: '50%', marginTop: '4px',
                          backgroundColor: isToday ? '#fff' : (isActive ? 'var(--success)' : 'var(--error)') 
                        }} />
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
