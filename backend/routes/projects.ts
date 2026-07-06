import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import Project from '../models/Project';
import Task from '../models/Task';
import Ticket from '../models/Ticket';
import Milestone from '../models/Milestone';
import User from '../models/User';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOADS_ROOT, req.params.id as string);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

const uploadSingle = (req: Request, res: Response, next: NextFunction): void => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') { res.status(400).json({ message: 'File exceeds the 10MB limit' }); return; }
      res.status(400).json({ message: err.message }); return;
    }
    if (err) { res.status(400).json({ message: (err as Error).message }); return; }
    if (!req.file) { res.status(400).json({ message: 'No file uploaded' }); return; }
    next();
  });
};

const requireMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const project = await Project.findOne({ _id: req.params.id, 'members.user': req.user._id });
  if (!project) { res.status(403).json({ message: 'Access denied' }); return; }
  req.project = project;
  next();
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort('-createdAt');
    res.json(projects);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, color, deadline, memberEmails } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const project = new Project({ title, description, color, deadline, owner: req.user._id });
    if (memberEmails && memberEmails.length) {
      const users = await User.find({ email: { $in: memberEmails } });
      users.forEach(u => {
        if (u._id.toString() !== (req.user._id as unknown as string).toString())
          project.members.push({ user: u._id, role: 'member' } as any);
      });
    }
    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, 'members.user': req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('files.uploadedBy', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
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
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Not found or not authorized' });
    await Task.deleteMany({ project: project._id });
    await Ticket.deleteMany({ project: project._id });
    await Milestone.deleteMany({ project: project._id });
    await project.deleteOne();
    fs.rm(path.join(UPLOADS_ROOT, req.params.id as string), { recursive: true, force: true }, () => {});
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.post('/:id/members', async (req: Request, res: Response) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Not found or not authorized' });
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const already = project.members.some(m => m.user.toString() === user._id.toString());
    if (already) return res.status(400).json({ message: 'Already a member' });
    project.members.push({ user: user._id, role: 'member' } as any);
    await project.save();
    await project.populate('members.user', 'name email avatar');
    res.json(project);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.delete('/:id/members/:userId', async (req: Request, res: Response) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Not found or not authorized' });
    if (req.params.userId === project.owner.toString())
      return res.status(400).json({ message: 'Cannot remove the owner' });
    project.members = project.members.filter(m => m.user.toString() !== req.params.userId) as any;
    await project.save();
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.post('/:id/files', requireMember, uploadSingle, async (req: Request, res: Response) => {
  try {
    const project = req.project!;
    project.files.push({
      filename: req.file!.filename,
      originalName: req.file!.originalname,
      mimeType: req.file!.mimetype,
      size: req.file!.size,
      uploadedBy: req.user._id,
    } as any);
    await project.save();
    await project.populate('files.uploadedBy', 'name email avatar');
    res.status(201).json(project.files[project.files.length - 1]);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.get('/:id/files/:fileId/download', requireMember, async (req: Request, res: Response) => {
  try {
    const file = req.project!.files.find(f => f._id!.toString() === req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });
    const filePath = path.join(UPLOADS_ROOT, req.params.id as string, file.filename);
    res.download(filePath, file.originalName);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.delete('/:id/files/:fileId', requireMember, async (req: Request, res: Response) => {
  try {
    const project = req.project!;
    const file = project.files.find(f => f._id!.toString() === req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });
    const filePath = path.join(UPLOADS_ROOT, req.params.id as string, file.filename);
    fs.unlink(filePath, () => {}); // best-effort disk cleanup
    project.files = project.files.filter(f => f._id!.toString() !== req.params.fileId) as any;
    await project.save();
    res.json({ message: 'File deleted' });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

export default router;
