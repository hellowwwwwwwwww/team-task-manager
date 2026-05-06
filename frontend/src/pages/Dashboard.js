import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const { stats, recentTasks } = data || {};

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
  const isOverdue = (task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.3rem' }}>Welcome back, {user?.name}</p>
        </div>
        <Link to="/projects" className="btn btn-primary">+ New Project</Link>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card stat-todo">
          <div className="stat-label">To Do</div>
          <div className="stat-value">{stats?.todo || 0}</div>
        </div>
        <div className="stat-card stat-progress">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{stats?.in_progress || 0}</div>
        </div>
        <div className="stat-card stat-done">
          <div className="stat-label">Done</div>
          <div className="stat-value">{stats?.done || 0}</div>
        </div>
        <div className="stat-card stat-overdue">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{stats?.overdue || 0}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.2rem' }}>Recent Tasks</h3>
        {recentTasks?.length === 0 ? (
          <div className="empty"><p>No tasks yet. Create a project to get started.</p></div>
        ) : (
          recentTasks?.map(task => (
            <div key={task.id} className="task-card" style={{ borderLeft: isOverdue(task) ? '3px solid var(--danger)' : '3px solid transparent' }}>
              <div className="task-header">
                <div>
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span>📁 {task.project_name}</span>
                    {task.assigned_name && <span>👤 {task.assigned_name}</span>}
                    {task.due_date && <span style={{ color: isOverdue(task) ? 'var(--danger)' : 'inherit' }}>📅 {formatDate(task.due_date)}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                  <span className={`status-badge status-${task.status}`}>{task.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
