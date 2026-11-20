const mongoose = require('mongoose');

const listingApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fullLegalName: { type: String, required: true, trim: true },
  businessName: { type: String, trim: true },
  cacNumber: { type: String, trim: true },
  address: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  idType: { type: String, enum: ['NIN', 'BVN', 'Driver License', 'Passport'], required: true },
  idNumber: { type: String, required: true, trim: true },
  propertyCount: { type: Number, min: 0 },
  about: { type: String, maxlength: 2000 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  adminNote: { type: String, default: '' },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ListingApplication', listingApplicationSchema);
