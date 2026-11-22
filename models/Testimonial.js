const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  role: { type: String, default: 'Renter' },
  location: { type: String, trim: true },
  quote: { type: String, required: true, trim: true, maxlength: 500 },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
