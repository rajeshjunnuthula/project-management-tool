import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  user: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask extends Document {
  title: string;
  description: string;
  project: Types.ObjectId;
  assignee: Types.ObjectId | null;
  reporter: Types.ObjectId;
  status: 'todo' | 'in-progress' | 'in-review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date | null;
  labels: string[];
  comments: Types.DocumentArray<IComment>;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['todo', 'in-progress', 'in-review', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  dueDate: { type: Date, default: null },
  labels: [{ type: String }],
  comments: [commentSchema],
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<ITask>('Task', taskSchema);
