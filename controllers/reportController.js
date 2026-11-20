const crypto = require('crypto');
const Report = require('../models/Report');
const Property = require('../models/Property');

function fingerprint(req) {
  return crypto.createHash('sha256')
    .update((req.ip || '') + (req.headers['user-agent'] || ''))
    .digest('hex').slice(0, 24);
}

exports.create = async (req, res, next) => {
  try {
    const { propertyId, reason, comment } = req.body;
    if (!propertyId || !reason) return res.status(400).json({ success: false, message: 'Missing required fields' });
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Listing not found' });

    const fp = fingerprint(req);
    const recent = await Report.findOne({
      property: propertyId, reporterFingerprint: fp,
      createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) }
    });
    if (recent) return res.status(429).json({ success: false, message: 'You already reported this listing recently' });

    const report = await Report.create({
      property: propertyId, reason, comment: comment || '', reporterFingerprint: fp
    });
    res.status(201).json({ success: true, report: { id: report._id, status: report.status } });
  } catch (e) { next(e); }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;
    const q = status ? { status } : {};
    const items = await Report.find(q).populate('property', 'title area state status').sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const r = await Report.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    if (status) r.status = status;
    if (adminNotes !== undefined) r.adminNotes = adminNotes;
    if (status === 'Reviewed' || status === 'Dismissed') r.reviewedAt = new Date();
    await r.save();
    res.json({ success: true, report: r });
  } catch (e) { next(e); }
};
