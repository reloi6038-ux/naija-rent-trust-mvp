const Property = require('../models/Property');
const Report = require('../models/Report');
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');

exports.stats = async (req, res, next) => {
  try {
    const [
      total, published, rented, unpublished, pending, rejected,
      openReports, reviewedReports, dismissedReports,
      enquiries, reviewed, listers
    ] = await Promise.all([
      Property.countDocuments(),
      Property.countDocuments({ status: 'Published' }),
      Property.countDocuments({ status: 'Rented' }),
      Property.countDocuments({ status: 'Unpublished' }),
      Property.countDocuments({ status: 'Pending' }),
      Property.countDocuments({ status: 'Rejected' }),
      Report.countDocuments({ status: 'Open' }),
      Report.countDocuments({ status: 'Reviewed' }),
      Report.countDocuments({ status: 'Dismissed' }),
      Enquiry.countDocuments(),
      Property.countDocuments({ reviewedAt: { $ne: null } }),
      User.countDocuments({ role: 'lister' })
    ]);
    res.json({ success: true, stats: {
      total, published, rented, unpublished, pending, rejected,
      openReports, reviewedReports, dismissedReports,
      enquiries, reviewed, listers
    }});
  } catch (e) { next(e); }
};

exports.listProperties = async (req, res, next) => {
  try {
    const items = await Property.find().populate('lister', 'name email phone').sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

exports.listPending = async (req, res, next) => {
  try {
    const items = await Property.find({ status: 'Pending' }).populate('lister', 'name email phone').sort({ createdAt: 1 });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

exports.recentActivity = async (req, res, next) => {
  try {
    const [recentReports, recentPending] = await Promise.all([
      Report.find({ status: 'Open' }).sort({ createdAt: -1 }).limit(5).populate('property', 'title'),
      Property.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(5).populate('lister', 'name')
    ]);
    res.json({ success: true, recentReports, recentPending });
  } catch (e) { next(e); }
};
