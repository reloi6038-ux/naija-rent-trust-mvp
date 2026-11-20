const User = require('../models/User');
const Property = require('../models/Property');
const Enquiry = require('../models/Enquiry');

/**
 * GET /api/users/:id/public
 * Public profile: name, role, member since, listing count, response rate.
 * No emails, no phones, no password hashes.
 */
exports.publicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ success: false, message: 'Lister not found' });

    const [listings, enquiryCounts] = await Promise.all([
      Property.find({ lister: user._id, status: 'Published' })
        .sort({ createdAt: -1 })
        .limit(12)
        .select('title photos annualRent area state bedrooms bathrooms propertyType totalMoveInCost createdAt reviewedAt'),
      Enquiry.aggregate([
        { $match: { lister: user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const totalEnquiries = enquiryCounts.reduce((s, e) => s + e.count, 0);
    const contactedEnquiries = enquiryCounts.find(e => e._id === 'Contacted')?.count || 0;
    const responseRate = totalEnquiries === 0 ? 0 : Math.round((contactedEnquiries / totalEnquiries) * 100);

    const totalListings = await Property.countDocuments({ lister: user._id, status: { $in: ['Published', 'Rented'] } });

    res.json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        role: user.role,
        memberSince: user.createdAt,
        totalListings,
        activeListings: listings.length,
        totalEnquiries,
        responseRate,
        listings
      }
    });
  } catch (e) { next(e); }
};

/**
 * GET /api/users/:id/properties
 * Paginated public listings for a lister.
 */
exports.publicListings = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    const query = { lister: req.params.id, status: 'Published' };
    const [data, total] = await Promise.all([
      Property.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Property.countDocuments(query)
    ]);

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (e) { next(e); }
};
