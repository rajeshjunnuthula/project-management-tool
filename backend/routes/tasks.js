const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

router.use(protect);

const isMember = async (projectId, userId) => {
  const p = await Project.findOne({ _id: projectId, 'members.user': userId });
  return !!p;
};

router.get('/', async (req, res) => {
  try {
    const { project, mine } = req.query;
    let query;
    if (mine === 'true') {
      query = { assignee: req.user._id };
    } else {
      if (!project) return res.status(400).json({ message: 'project query param required' });
      if (!(await isMember(project, req.user._id)))
        return res.status(403).json({ message: 'Access denied' });
      query = { project };
    }
    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('project', 'title color')
      .populate('comments.user', 'name email avatar')
      .sort(mine === 'true' ? 'dueDate' : 'order');
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, project, assignee, status, priority, dueDate, labels } = req.body;
    if (!title || !project) return res.status(400).json({ message: 'title and project are required' });
    if (!(await isMember(project, req.user._id)))
      return res.status(403).json({ message: 'Access denied' });
    const count = await Task.countDocuments({ project, status: status || 'todo' });
    const task = await Task.create({
      title, description, project, assignee, reporter: req.user._id,
      status, priority, dueDate, labels, order: count,
    });
    await task.populate('assignee', 'name email avatar');
    await task.populate('reporter', 'name email avatar');
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!(await isMember(task.project, req.user._id)))
      return res.status(403).json({ message: 'Access denied' });
    const fields = ['title', 'description', 'assignee', 'status', 'priority', 'dueDate', 'labels', 'order'];
    fields.forEach(f => { if (req.body[f] !== undefined) task[f] = req.body[f]; });
    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('reporter', 'name email avatar');
    await task.populate('comments.user', 'name email avatar');
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!(await isMember(task.project, req.user._id)))
      return res.status(403).json({ message: 'Access denied' });
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!(await isMember(task.project, req.user._id)))
      return res.status(403).json({ message: 'Access denied' });
    task.comments.push({ user: req.user._id, content });
    await task.save();
    await task.populate('comments.user', 'name email avatar');
    res.status(201).json(task.comments[task.comments.length - 1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
