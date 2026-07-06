import { IUser } from '../models/User';
import { IProject } from '../models/Project';

declare global {
  namespace Express {
    interface Request {
      user: IUser;
      project?: IProject;
    }
  }
}
