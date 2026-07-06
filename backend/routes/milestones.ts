import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import Milestone from '../models/Milestone';
import Project from '../models/Project';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

const isMember = async (projectId: Types.ObjectId | string, userId: Types.ObjectId): Promise<boolean> => {
  const p = await Project.findOne({ _id: projectId, 'members.user': userId });
  return !!p;
};

const myProjectIds = async (userId: Types.ObjectId): Promise<Types.ObjectId[]> => {
  const projects = await Project.find({ 'members.user': userId }).select('_id');
  return projects.map(p => p._id as Types.ObjectId);
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const project = req.query.project as string | undefined;
    let query: Record<string, unknown>;
    if (project) {
      if (!(await isMember(project, req.user._id as Types.ObjectId)))
        return res.status(403).json({ message: 'Access denied' });
      query = { project };
    } else {
      query = { project: { $in: await myProjectIds(req.user._id as Types.ObjectId) } };
    }
    const milestones = await Milestone.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('project', 'title color')
      .sort('dueDate');
    res.json(milestones);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, project, dueDate } = req.body;
    if (!title || !project || !dueDate) return res.status(400).json({ message: 'title, project and dueDate are required' });
    if (!(await isMember(project, req.user._id as Types.ObjectId)))
      return res.status(403).json({ message: 'Access denied' });
    const milestone = await Milestone.create({ title, description, project, dueDate, createdBy: req.user._id });
    await milestone.populate('createdBy', 'name email avatar');
    res.status(201).json(milestone);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    if (!(await isMember(milestone.project, req.user._id as Types.ObjectId)))
      return res.status(403).json({ message: 'Access denied' });
    const fields = ['title', 'description', 'dueDate', 'completed'] as const;
    fields.forEach(f => { if (req.body[f] !== undefined) (milestone as any)[f] = req.body[f]; });
    await milestone.save();
    await milestone.populate('createdBy', 'name email avatar');
    res.json(milestone);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    if (!(await isMember(milestone.project, req.user._id as Types.ObjectId)))
      return res.status(403).json({ message: 'Access denied' });
    await milestone.deleteOne();
    res.json({ message: 'Milestone deleted' });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

export default router;
