import { Router, Request, Response } from 'express';
import User from '../models/User';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] } : {};
    const users = await User.find(filter).limit(20).select('name email avatar');
    res.json(users);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

router.put('/me', async (req: Request, res: Response) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();
    res.json(user);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
});

export default router;
