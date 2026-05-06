const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getTasks, createTask, updateTask, deleteTask, getDashboard } = require('../controllers/taskController');

router.use(authenticate);
router.get('/dashboard', getDashboard);
router.get('/project/:projectId', getTasks);
router.post('/project/:projectId', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
