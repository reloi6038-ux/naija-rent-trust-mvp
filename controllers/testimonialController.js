const Testimonial = require('../models/Testimonial');

exports.create = async (req, res, next) => {
  try {
    const { name, location, quote, rating } = req.body;
    if (!name || !quote) {
      return res.status(400).json({ success: false, message: 'Name and quote are required' });
    }
    const testimonial = await Testimonial.create({ 
      user: req.user?._id, 
      name, location, quote, 
      rating: rating || 5,
      status: 'Pending' 
    });
    res.status(201).json({ success: true, testimonial, message: 'Submitted for review' });
  } catch (e) { next(e); }
};

exports.listPublic = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ status: 'Approved' }).sort({ createdAt: -1 }).limit(6);
    res.json({ success: true, data: testimonials });
  } catch (e) { next(e); }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json({ success: true, data: testimonials });
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const t = await Testimonial.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, testimonial: t });
  } catch (e) { next(e); }
};
