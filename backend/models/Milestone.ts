import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMilestone extends Document {
  title: string;
  description: string;
  project: Types.ObjectId;
  dueDate: Date;
  completed: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  dueDate: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<IMilestone>('Milestone', milestoneSchema);
