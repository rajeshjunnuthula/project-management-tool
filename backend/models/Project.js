const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  status: { type: String, enum: ['active', 'on-hold', 'completed', 'archived'], default: 'active' },
  color: { type: String, default: '#6366f1' },
  deadline: { type: Date },
}, { timestamps: true });

projectSchema.pre('save', function (next) {
  const ownerExists = this.members.some(m => m.user.toString() === this.owner.toString());
  if (!ownerExists) {
    this.members.unshift({ user: this.owner, role: 'owner' });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
