const router = require('express').Router();
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

router.use(protect);

const isMember = async (projectId, userId) => {
  const p = await Project.findOne({ _id: projectId, 'members.user': userId });
  return !!p;
};

const myProjectIds = async (userId) => {
  const projects = await Project.find({ 'members.user': userId }).select('_id');
  return projects.map(p => p._id);
};

router.get('/', async (req, res) => {
  try {
    const { project } = req.query;
    let query;
    if (project) {
      if (!(await isMember(project, req.user._id)))
        return res.status(403).json({ message: 'Access denied' });
      query = { project };
    } else {
      query = { project: { $in: await myProjectIds(req.user._id) } };
    }
    const tickets = await Ticket.find(query)
      .populate('reporter', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('project', 'title color')
      .sort('-createdAt');
    res.json(tickets);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, project, type, priority, assignee } = req.body;
    if (!title || !project) return res.status(400).json({ message: 'title and project are required' });
    if (!(await isMember(project, req.user._id)))
      return res.status(403).json({ message: 'Access denied' });
    const ticket = await Ticket.create({
      title, description, project, type, priority, assignee, reporter: req.user._id,
    });
    await ticket.populate('reporter', 'name email avatar');
    await ticket.populate('assignee', 'name email avatar');
    res.status(201).json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!(await isMember(ticket.project, req.user._id)))
      return res.status(403).json({ message: 'Access denied' });
    const fields = ['title', 'description', 'type', 'status', 'priority', 'assignee'];
    fields.forEach(f => { if (req.body[f] !== undefined) ticket[f] = req.body[f]; });
    await ticket.save();
    await ticket.populate('reporter', 'name email avatar');
    await ticket.populate('assignee', 'name email avatar');
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!(await isMember(ticket.project, req.user._id)))
      return res.status(403).json({ message: 'Access denied' });
    await ticket.deleteOne();
    res.json({ message: 'Ticket deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
