const router = require('express').Router();
const Milestone = require('../models/Milestone');
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
    const milestones = await Milestone.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('project', 'title color')
      .sort('dueDate');
    res.json(milestones);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, project, dueDate } = req.body;
    if (!title || !project || !dueDate) return res.status(400).json({ message: 'title, project and dueDate are required' });
    if (!(await isMember(project, req.user._id)))
      return res.status(403).json({ message: 'Access denied' });
    const milestone = await Milestone.create({ title, description, project, dueDate, createdBy: req.user._id });
    await milestone.populate('createdBy', 'name email avatar');
    res.status(201).json(milestone);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    if (!(await isMember(milestone.project, req.user._id)))
      return res.status(403).json({ message: 'Access denied' });
    const fields = ['title', 'description', 'dueDate', 'completed'];
    fields.forEach(f => { if (req.body[f] !== undefined) milestone[f] = req.body[f]; });
    await milestone.save();
    await milestone.populate('createdBy', 'name email avatar');
    res.json(milestone);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    if (!(await isMember(milestone.project, req.user._id)))
      return res.status(403).json({ message: 'Access denied' });
    await milestone.deleteOne();
    res.json({ message: 'Milestone deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
