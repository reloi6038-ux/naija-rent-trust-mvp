const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  lister: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  renterName: { type: String, required: true, trim: true, maxlength: 100 },
  renterPhone: { type: String, required: true, trim: true, maxlength: 30 },
  renterEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
  message: { type: String, trim: true, maxlength: 1000 },
  preferredInspectionDate: { type: Date },
  status: { type: String, enum: ['New', 'Contacted'], default: 'New', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
