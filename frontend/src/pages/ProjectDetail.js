import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'in_progress', 'done'];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('kanban');
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' });
  const [memberForm, setMemberForm] = useState({ email: '', role: 'member' });
  const [error, setError] = useState('');

  const isOwner = project?.owner_id === user?.id;
  const isAdmin = user?.role === 'admin';

  const fetchAll = async () => {
    try {
      const [proj, tsk] = await Promise.all([projectAPI.getOne(id), taskAPI.getByProject(id)]);
      setProject(proj.data);
      setTasks(tsk.data);
    } catch { navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const openCreateTask = () => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title, description: task.description || '',
      status: task.status, priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      assigned_to: task.assigned_to || ''
    });
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const payload = { ...taskForm, assigned_to: taskForm.assigned_to || null, due_date: taskForm.due_date || null };
      if (editTask) await taskAPI.update(editTask.id, payload);
      else await taskAPI.create(id, payload);
      setShowTaskModal(false);
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await taskAPI.delete(taskId);
    fetchAll();
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setError('');
    try {
      await projectAPI.addMember(id, memberForm);
      setShowMemberModal(false);
      setMemberForm({ email: '', role: 'member' });
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove member?')) return;
    await projectAPI.removeMember(id, userId);
    fetchAll();
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all tasks?')) return;
    await projectAPI.delete(id);
    navigate('/projects');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : null;
  const isOverdue = (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';

  if (loading) return <div className="loading">Loading project...</div>;

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  const TaskCard = ({ task }) => (
    <div className="task-card" style={{ borderLeft: isOverdue(task) ? '3px solid var(--danger)' : '3px solid var(--primary)' }}>
      <div className="task-header">
        <div style={{ flex: 1 }}>
          <div className="task-title">{task.title}</div>
          {task.description && <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '0.3rem' }}>{task.description}</div>}
          <div className="task-meta">
            <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
            {task.assigned_name && <span>👤 {task.assigned_name}</span>}
            {task.due_date && <span style={{ color: isOverdue(task) ? 'var(--danger)' : 'var(--muted)' }}>📅 {formatDate(task.due_date)}</span>}
          </div>
        </div>
        <div className="task-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => openEditTask(task)}>✏️</button>
          {(isOwner || isAdmin) && <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteTask(task.id)}>🗑️</button>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          {project.description && <p style={{ color: 'var(--muted)', marginTop: '0.3rem' }}>{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          {(isOwner || isAdmin) && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMemberModal(true)}>+ Member</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>
            </>
          )}
          <button className="btn btn-primary" onClick={openCreateTask}>+ Task</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'kanban' ? 'active' : ''}`} onClick={() => setTab('kanban')}>Kanban Board</button>
        <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>List View</button>
        <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>Members ({project.members?.length})</button>
      </div>

      {tab === 'kanban' && (
        <div className="kanban">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <span style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                <span className="col-count">{tasksByStatus(status).length}</span>
              </div>
              {tasksByStatus(status).length === 0
                ? <div style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No tasks</div>
                : tasksByStatus(status).map(t => <TaskCard key={t.id} task={t} />)
              }
            </div>
          ))}
        </div>
      )}

      {tab === 'list' && (
        <div>
          {tasks.length === 0
            ? <div className="empty"><h3>No tasks</h3><p>Create your first task</p></div>
            : tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1 }}><TaskCard task={t} /></div>
                <span className={`status-badge status-${t.status}`}>{t.status.replace('_', ' ')}</span>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'members' && (
        <div>
          <div className="members-list">
            {project.members?.map(m => (
              <div key={m.id} className="member-item">
                <div className="member-info">
                  <span className="member-name">{m.name}</span>
                  <span className="member-email">{m.email}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <span className="badge">{m.role}</span>
                  {(isOwner || isAdmin) && m.id !== user.id && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveMember(m.id)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editTask ? 'Edit Task' : 'Create Task'}</h3>
            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Assign To</label>
                  <select value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              {error && <div className="form-error">{error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editTask ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Member</h3>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={memberForm.email} onChange={e => setMemberForm({...memberForm, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <div className="form-error">{error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
