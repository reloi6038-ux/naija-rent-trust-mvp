const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  reason: { type: String, required: true, enum: ['Fake listing', 'Wrong price', 'Already rented', 'Suspicious agent', 'Other'] },
  comment: { type: String, trim: true, maxlength: 800 },
  status: { type: String, enum: ['Open', 'Reviewed', 'Dismissed'], default: 'Open', index: true },
  reviewedAt: Date,
  adminNotes: { type: String, default: '' },
  reporterFingerprint: { type: String, index: true }
}, { timestamps: true });

reportSchema.index({ property: 1, reporterFingerprint: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
