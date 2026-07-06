export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  role?: 'admin' | 'member';
}

export interface Member {
  user: User;
  role: 'owner' | 'admin' | 'member';
}

export interface ProjectFile {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: User;
  createdAt: string;
}

export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'archived';

export interface Project {
  _id: string;
  title: string;
  description: string;
  owner: User;
  members: Member[];
  files: ProjectFile[];
  status: ProjectStatus;
  color: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRef {
  _id: string;
  title: string;
  color: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Comment {
  _id: string;
  user: User;
  content: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  project: string | ProjectRef;
  assignee: User | null;
  reporter: User;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  labels: string[];
  comments: Comment[];
  order: number;
}

export type TicketType = 'bug' | 'feature' | 'question' | 'other';
export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  project: ProjectRef;
  reporter: User;
  assignee: User | null;
  type: TicketType;
  status: TicketStatus;
  priority: Priority;
  createdAt: string;
}

export interface Milestone {
  _id: string;
  title: string;
  description: string;
  project: ProjectRef;
  dueDate: string;
  completed: boolean;
  createdBy: User;
}
