import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMember {
  user: Types.ObjectId;
  role: 'owner' | 'admin' | 'member';
}

export interface IProjectFile extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject extends Document {
  title: string;
  description: string;
  owner: Types.ObjectId;
  members: Types.DocumentArray<IMember & Document>;
  files: Types.DocumentArray<IProjectFile>;
  status: 'active' | 'on-hold' | 'completed' | 'archived';
  color: string;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IMember>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
}, { _id: false });

const fileSchema = new Schema<IProjectFile>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const projectSchema = new Schema<IProject>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  files: [fileSchema],
  status: { type: String, enum: ['active', 'on-hold', 'completed', 'archived'], default: 'active' },
  color: { type: String, default: '#6366f1' },
  deadline: { type: Date },
}, { timestamps: true });

projectSchema.pre('save', function (next) {
  const ownerExists = this.members.some(m => m.user.toString() === this.owner.toString());
  if (!ownerExists) {
    this.members.unshift({ user: this.owner, role: 'owner' } as IMember);
  }
  next();
});

export default mongoose.model<IProject>('Project', projectSchema);
