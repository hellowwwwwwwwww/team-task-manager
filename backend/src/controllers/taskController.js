const { pool } = require('../models/db');

const getTasks = async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(`
      SELECT t.*, u.name as assigned_name, c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC
    `, [projectId]);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, status, priority, due_date, assigned_to } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, status || 'todo', priority || 'medium', due_date || null, projectId, assigned_to || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, due_date, assigned_to } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, status=$3, priority=$4, due_date=$5, assigned_to=$6
       WHERE id=$7 RETURNING *`,
      [title, description, status, priority, due_date || null, assigned_to || null, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'todo') as todo,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'done') as done,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'done') as overdue
      FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = $1
    `, [req.user.id]);

    const recentTasks = await pool.query(`
      SELECT t.*, u.name as assigned_name, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN projects p ON t.project_id = p.id
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = $1
      ORDER BY t.created_at DESC LIMIT 10
    `, [req.user.id]);

    res.json({ stats: stats.rows[0], recentTasks: recentTasks.rows });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getDashboard };
