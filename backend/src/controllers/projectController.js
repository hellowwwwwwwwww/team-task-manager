const { pool } = require('../models/db');

const getProjects = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = $1 OR p.id IN (
        SELECT project_id FROM project_members WHERE user_id = $1
      )
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const createProject = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.id]
    );
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [result.rows[0].id, req.user.id, 'admin']
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const getProject = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await pool.query(`
      SELECT p.*, u.name as owner_name FROM projects p
      JOIN users u ON p.owner_id = u.id WHERE p.id = $1
    `, [id]);
    if (!project.rows[0]) return res.status(404).json({ error: 'Project not found' });

    const members = await pool.query(`
      SELECT u.id, u.name, u.email, pm.role FROM users u
      JOIN project_members pm ON u.id = pm.user_id WHERE pm.project_id = $1
    `, [id]);

    res.json({ ...project.rows[0], members: members.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const check = await pool.query('SELECT * FROM projects WHERE id = $1 AND owner_id = $2', [id, req.user.id]);
    if (!check.rows[0]) return res.status(403).json({ error: 'Not authorized' });
    const result = await pool.query(
      'UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT * FROM projects WHERE id = $1 AND owner_id = $2', [id, req.user.id]);
    if (!check.rows[0]) return res.status(403).json({ error: 'Not authorized' });
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const addMember = async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;
  try {
    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!user.rows[0]) return res.status(404).json({ error: 'User not found' });
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [id, user.rows[0].id, role || 'member']
    );
    res.json({ message: 'Member added' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  const { id, userId } = req.params;
  try {
    await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
