import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import Task from '../models/Task';
import Project from '../models/Project';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

const isMember = async (projectId: Types.ObjectId | string, userId: Types.ObjectId): Promise<boolean> => {
  const p = await Project.findOne({ _id: projectId, 'members.user': userId });
  return !!p;
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const project = req.query.project as string | undefined;
    const mine = req.query.mine as string | undefined;
    let query: Record<string, unknown>;
    if (mine === 'true') {
      query = { assignee: req.user._id };
    } else {
      if (!project) return res.status(400).json({ message: 'project query param required' });
      if (!(await isMember(project, req.user._id as Types.ObjectId)))
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
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, project, assignee, status, priority, dueDate, labels } = req.body;
    if (!title || !project) return res.status(400).json({ message: 'title and project are required' });
    if (!(await isMember(project, req.user._id as Types.ObjectId)))
      return res.status(403).json({ message: 'Access denied' });
    const count = await Task.countDocuments({ project, status: status || 'todo' });
    const task = await Task.create({
      title, description, project, assignee, reporter: req.user._id,
      status, priority, dueDate, labels, order: count,
    });
    await task.populate('assignee', 'name email avatar');
    await task.populate('reporter', 'name email avatar');
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!(await isMember(task.project, req.user._id as Types.ObjectId)))
      return res.status(403).json({ message: 'Access denied' });
    const fields = ['title', 'description', 'assignee', 'status', 'priority', 'dueDate', 'labels', 'order'] as const;
    fields.forEach(f => { if (req.body[f] !== undefined) (task as any)[f] = req.body[f]; });
    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('reporter', 'name email avatar');
    await task.populate('comments.user', 'name email avatar');
    res.json(task);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!(await isMember(task.project, req.user._id as Types.ObjectId)))
      return res.status(403).json({ message: 'Access denied' });
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!(await isMember(task.project, req.user._id as Types.ObjectId)))
      return res.status(403).json({ message: 'Access denied' });
    task.comments.push({ user: req.user._id, content } as any);
    await task.save();
    await task.populate('comments.user', 'name email avatar');
    res.status(201).json(task.comments[task.comments.length - 1]);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

export default router;
