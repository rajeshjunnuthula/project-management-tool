import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import Ticket from '../models/Ticket';
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
    const tickets = await Ticket.find(query)
      .populate('reporter', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('project', 'title color')
      .sort('-createdAt');
    res.json(tickets);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, project, type, priority, assignee } = req.body;
    if (!title || !project) return res.status(400).json({ message: 'title and project are required' });
    if (!(await isMember(project, req.user._id as Types.ObjectId)))
      return res.status(403).json({ message: 'Access denied' });
    const ticket = await Ticket.create({
      title, description, project, type, priority, assignee, reporter: req.user._id,
    });
    await ticket.populate('reporter', 'name email avatar');
    await ticket.populate('assignee', 'name email avatar');
    res.status(201).json(ticket);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!(await isMember(ticket.project, req.user._id as Types.ObjectId)))
      return res.status(403).json({ message: 'Access denied' });
    const fields = ['title', 'description', 'type', 'status', 'priority', 'assignee'] as const;
    fields.forEach(f => { if (req.body[f] !== undefined) (ticket as any)[f] = req.body[f]; });
    await ticket.save();
    await ticket.populate('reporter', 'name email avatar');
    await ticket.populate('assignee', 'name email avatar');
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!(await isMember(ticket.project, req.user._id as Types.ObjectId)))
      return res.status(403).json({ message: 'Access denied' });
    await ticket.deleteOne();
    res.json({ message: 'Ticket deleted' });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

export default router;
