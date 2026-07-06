const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Ticket = require('../models/Ticket');
const Milestone = require('../models/Milestone');
const { protect } = require('../middleware/auth');

router.use(protect);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOADS_ROOT, req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'File exceeds the 10MB limit' });
      return res.status(400).json({ message: err.message });
    }
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    next();
  });
};

const requireMember = async (req, res, next) => {
  const project = await Project.findOne({ _id: req.params.id, 'members.user': req.user._id });
  if (!project) return res.status(403).json({ message: 'Access denied' });
  req.project = project;
  next();
};

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort('-createdAt');
    res.json(projects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, color, deadline, memberEmails } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const project = new Project({ title, description, color, deadline, owner: req.user._id });
    if (memberEmails && memberEmails.length) {
      const User = require('../models/User');
      const users = await User.find({ email: { $in: memberEmails } });
      users.forEach(u => {
        if (u._id.toString() !== req.user._id.toString())
          project.members.push({ user: u._id, role: 'member' });
      });
    }
    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, 'members.user': req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('files.uploadedBy', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Not found or not authorized' });
    const { title, description, color, deadline, status } = req.body;
    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;
    if (deadline !== undefined) project.deadline = deadline;
    if (status) project.status = status;
    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Not found or not authorized' });
    await Task.deleteMany({ project: project._id });
    await Ticket.deleteMany({ project: project._id });
    await Milestone.deleteMany({ project: project._id });
    await project.deleteOne();
    fs.rm(path.join(UPLOADS_ROOT, req.params.id), { recursive: true, force: true }, () => {});
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/members', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Not found or not authorized' });
    const User = require('../models/User');
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const already = project.members.some(m => m.user.toString() === user._id.toString());
    if (already) return res.status(400).json({ message: 'Already a member' });
    project.members.push({ user: user._id, role: 'member' });
    await project.save();
    await project.populate('members.user', 'name email avatar');
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Not found or not authorized' });
    if (req.params.userId === project.owner.toString())
      return res.status(400).json({ message: 'Cannot remove the owner' });
    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/files', requireMember, uploadSingle, async (req, res) => {
  try {
    const project = req.project;
    project.files.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
    });
    await project.save();
    await project.populate('files.uploadedBy', 'name email avatar');
    res.status(201).json(project.files[project.files.length - 1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id/files/:fileId/download', requireMember, async (req, res) => {
  try {
    const file = req.project.files.find(f => f._id.toString() === req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });
    const filePath = path.join(UPLOADS_ROOT, req.params.id, file.filename);
    res.download(filePath, file.originalName);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/files/:fileId', requireMember, async (req, res) => {
  try {
    const project = req.project;
    const file = project.files.find(f => f._id.toString() === req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });
    const filePath = path.join(UPLOADS_ROOT, req.params.id, file.filename);
    fs.unlink(filePath, () => {}); // best-effort disk cleanup
    project.files = project.files.filter(f => f._id.toString() !== req.params.fileId);
    await project.save();
    res.json({ message: 'File deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
