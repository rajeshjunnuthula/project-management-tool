import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITicket extends Document {
  title: string;
  description: string;
  project: Types.ObjectId;
  reporter: Types.ObjectId;
  assignee: Types.ObjectId | null;
  type: 'bug' | 'feature' | 'question' | 'other';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  type: { type: String, enum: ['bug', 'feature', 'question', 'other'], default: 'bug' },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
}, { timestamps: true });

export default mongoose.model<ITicket>('Ticket', ticketSchema);
