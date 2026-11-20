const Enquiry = require('../models/Enquiry');
const Property = require('../models/Property');
const User = require('../models/User');
const mailer = require('../services/mailer');

exports.create = async (req, res, next) => {
  try {
    const { propertyId, renterName, renterPhone, renterEmail, message, preferredInspectionDate } = req.body;
    if (!propertyId || !renterName || !renterPhone || !renterEmail) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const property = await Property.findById(propertyId);
    if (!property || property.status !== 'Published') {
      return res.status(404).json({ success: false, message: 'Listing unavailable' });
    }
    const enquiry = await Enquiry.create({
      property: property._id, lister: property.lister,
      renterName, renterPhone, renterEmail, message,
      preferredInspectionDate: preferredInspectionDate ? new Date(preferredInspectionDate) : undefined
    });
    // Fire-and-forget email
    const lister = await User.findById(property.lister);
    if (lister?.email) mailer.sendEnquiryNotification(lister, property, enquiry).catch(() => {});
    res.status(201).json({ success: true, enquiry });
  } catch (e) { next(e); }
};

exports.myEnquiries = async (req, res, next) => {
  try {
    const items = await Enquiry.find({ lister: req.user._id })
      .populate('property', 'title area state annualRent photos status')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

exports.markContacted = async (req, res, next) => {
  try {
    const e = await Enquiry.findById(req.params.id);
    if (!e) return res.status(404).json({ success: false, message: 'Not found' });
    if (String(e.lister) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Forbidden' });
    e.status = 'Contacted';
    await e.save();
    res.json({ success: true, enquiry: e });
  } catch (e) { next(e); }
};
