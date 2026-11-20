const mongoose = require('mongoose');

const reviewEntrySchema = new mongoose.Schema({
  action: { type: String, enum: ['submitted', 'approved', 'rejected', 'unpublished', 'restored', 'updated', 'price_changed'], required: true },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  byRole: { type: String, enum: ['lister', 'admin', 'system'], default: 'system' },
  note: { type: String, default: '' },
  at: { type: Date, default: Date.now }
}, { _id: false });

const priceHistorySchema = new mongoose.Schema({
  annualRent: { type: Number, required: true },
  agencyFee: { type: Number, default: 0 },
  legalFee: { type: Number, default: 0 },
  cautionDeposit: { type: Number, default: 0 },
  totalMoveInCost: { type: Number, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByRole: { type: String, enum: ['lister', 'admin'], default: 'lister' },
  reason: { type: String, default: '' },
  at: { type: Date, default: Date.now }
}, { _id: false });

const conditionReportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterName: { type: String, default: 'Anonymous' },
  reporterFingerprint: { type: String, index: true },
  checks: [{
    key: String,
    label: String,
    status: { type: String, enum: ['OK', 'Issues', 'Not checked'], default: 'Not checked' },
    note: String
  }],
  overallRating: { type: Number, min: 1, max: 5 },
  visitedAt: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  propertyType: {
    type: String, required: true,
    enum: ['Self Contain', 'Mini Flat', 'Flat', 'Duplex', 'Detached House', 'Terraced House'],
    index: true
  },
  state: { type: String, required: true, trim: true, index: true },
  area: { type: String, required: true, trim: true, index: true },
  address: { type: String, trim: true },

  // Coordinates for map search
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },

  annualRent: { type: Number, required: true, min: 0, index: true },
  bedrooms: { type: Number, required: true, min: 0, max: 20 },
  bathrooms: { type: Number, required: true, min: 0, max: 20 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  amenities: [{ type: String, trim: true }],
  photos: { type: [String], validate: v => v.length >= 1 && v.length <= 5 },
  agencyFee: { type: Number, default: 0, min: 0 },
  legalFee: { type: Number, default: 0, min: 0 },
  cautionDeposit: { type: Number, default: 0, min: 0 },
  totalMoveInCost: { type: Number, required: true, min: 0 },

  lister: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  listerType: { type: String, enum: ['landlord', 'agent'], default: 'agent' },

  status: { type: String, enum: ['Pending', 'Published', 'Rented', 'Unpublished', 'Rejected'], default: 'Pending', index: true },
  adminNote: { type: String, default: '' },

  reviewedAt: { type: Date, index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewHistory: { type: [reviewEntrySchema], default: [] },

  // NEW: price history
  priceHistory: { type: [priceHistorySchema], default: [] },

  // NEW: crowdsourced condition reports
  conditionReports: { type: [conditionReportSchema], default: [] },

  // NEW: aggregate condition score (0-5, computed on write)
  conditionScore: { type: Number, default: 0, min: 0, max: 5, index: true },

  photoHash: { type: String, index: true }
}, { timestamps: true });

propertySchema.index({ status: 1, annualRent: 1, state: 1, propertyType: 1 });
propertySchema.index({ status: 1, reviewedAt: -1 });
propertySchema.index({ status: 1, createdAt: -1 });
propertySchema.index({ coordinates: '2dsphere' });
propertySchema.index({ 'priceHistory.at': -1 });

propertySchema.methods.appendReview = function ({ action, by, byRole = 'system', note = '' }) {
  this.reviewHistory.push({ action, by, byRole, note, at: new Date() });
  if (action === 'approved') {
    this.reviewedAt = new Date();
    this.reviewedBy = by;
    this.status = 'Published';
  }
  if (action === 'rejected') { this.status = 'Rejected'; this.adminNote = note; }
  if (action === 'unpublished') { this.status = 'Unpublished'; this.adminNote = note; }
  if (action === 'restored') { this.status = 'Published'; this.adminNote = ''; }
};

propertySchema.methods.appendPriceChange = function ({ changedBy, changedByRole = 'lister', reason = '' }) {
  this.priceHistory.push({
    annualRent: this.annualRent,
    agencyFee: this.agencyFee,
    legalFee: this.legalFee,
    cautionDeposit: this.cautionDeposit,
    totalMoveInCost: this.totalMoveInCost,
    changedBy,
    changedByRole,
    reason,
    at: new Date()
  });
};

module.exports = mongoose.model('Property', propertySchema);
