import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function LiveSchedule() {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', scheduledAt: '', durationMinutes: 60 });
  const isInstructor = user?.role === 'instructor';

  useEffect(() => { fetchSessions(); }, [courseId]);

  async function fetchSessions() {
    const token = localStorage.getItem('token');
    const { data } = await axios.get(`/api/live/course/${courseId}`, { headers: { Authorization: `Bearer ${token}` }});
    setSessions(data);
  }

  async function createSession(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await axios.post('/api/live', { courseId, ...form }, { headers: { Authorization: `Bearer ${token}` }});
    setForm({ title: '', description: '', scheduledAt: '', durationMinutes: 60 });
    fetchSessions();
  }

  async function startSession(sessionId) {
    const token = localStorage.getItem('token');
    await axios.patch(`/api/live/${sessionId}/status`, { status: 'live' }, { headers: { Authorization: `Bearer ${token}` }});
    navigate(`/live/${sessionId}`);
  }

  return (
    <div className="dashboard" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="dashboard-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Live Classes</h1>
      </div>

      {isInstructor && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, color: '#111827' }}>Schedule a New Session</h3>
          <form onSubmit={createSession} style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required style={{ gridColumn: '1 / span 1' }} />
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm(f => ({ ...f, scheduledAt: e.target.value }))} required style={{ gridColumn: '2 / span 1' }} />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} style={{ gridColumn: '1 / span 1', minHeight: 44 }} />
            <input type="number" min={15} max={240} value={form.durationMinutes} onChange={(e) => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} placeholder="Duration (mins)" style={{ gridColumn: '2 / span 1' }} />
            <div style={{ gridColumn: '1 / span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" type="submit">Schedule Session</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 12, color: '#111827' }}>Upcoming & Live</h3>
        {sessions.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No sessions yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {sessions.map(s => (
              <div key={s._id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: 14, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{s.title}</div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>{new Date(s.scheduledAt).toLocaleString()} · {s.status}</div>
                </div>
                {s.status === 'live' ? (
                  <Link className="btn btn-secondary" to={`/live/${s._id}`}>Join</Link>
                ) : isInstructor ? (
                  <button className="btn btn-secondary" onClick={() => startSession(s._id)}>Start</button>
                ) : (
                  <button className="btn btn-secondary" disabled>Not live</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


