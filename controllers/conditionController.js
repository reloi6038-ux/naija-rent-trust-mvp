const crypto = require('crypto');
const Property = require('../models/Property');

const CHECKS = [
  { key: 'water', label: 'Water pressure & supply' },
  { key: 'power', label: 'Electrical & power supply' },
  { key: 'walls', label: 'Walls, ceilings & paint' },
  { key: 'floors', label: 'Floors & tiles' },
  { key: 'plumbing', label: 'Plumbing & drainage' },
  { key: 'security', label: 'Security & gates' },
  { key: 'roof', label: 'Roof & leaks' },
  { key: 'pests', label: 'Pests & infestation' }
];

function fingerprint(req) {
  return crypto.createHash('sha256')
    .update((req.ip || '') + (req.headers['user-agent'] || ''))
    .digest('hex').slice(0, 24);
}

exports.getChecklist = (req, res) => {
  res.json({ success: true, checks: CHECKS });
};

exports.submit = async (req, res, next) => {
  try {
    const { checks, overallRating, notes, visitedAt } = req.body;
    if (!Array.isArray(checks) || !checks.length) {
      return res.status(400).json({ success: false, message: 'At least one check required' });
    }
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Listing not found' });

    const fp = fingerprint(req);
    const existing = property.conditionReports.find(r => r.reporterFingerprint === fp);
    if (existing) {
      return res.status(429).json({ success: false, message: 'You already submitted a report for this listing' });
    }

    // Sanitize inputs
    const cleanChecks = checks
      .filter(c => c && ['OK', 'Issues', 'Not checked'].includes(c.status))
      .map(c => ({
        key: String(c.key || '').slice(0, 40),
        label: String(c.label || '').slice(0, 120),
        status: c.status,
        note: String(c.note || '').slice(0, 300)
      }));

    property.conditionReports.push({
      reportedBy: req.user?._id,
      reporterName: req.user?.name || 'Anonymous renter',
      reporterFingerprint: fp,
      checks: cleanChecks,
      overallRating: overallRating ? Math.min(5, Math.max(1, Number(overallRating))) : undefined,
      notes: String(notes || '').slice(0, 800),
      visitedAt: visitedAt ? new Date(visitedAt) : undefined
    });

    // Recompute average condition score
    const ratings = property.conditionReports.map(r => r.overallRating).filter(n => n > 0);
    property.conditionScore = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    await property.save();
    res.status(201).json({ success: true, message: 'Condition report submitted' });
  } catch (e) { next(e); }
};

exports.summary = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).select('conditionReports conditionScore').lean();
    if (!property) return res.status(404).json({ success: false, message: 'Not found' });

    // Aggregate per-check stats
    const byCheck = {};
    for (const report of property.conditionReports) {
      for (const c of report.checks) {
        byCheck[c.key] = byCheck[c.key] || { label: c.label, OK: 0, Issues: 0, total: 0 };
        if (c.status === 'OK') byCheck[c.key].OK++;
        if (c.status === 'Issues') byCheck[c.key].Issues++;
        byCheck[c.key].total++;
      }
    }

    res.json({
      success: true,
      totalReports: property.conditionReports.length,
      averageScore: property.conditionScore || 0,
      byCheck: Object.values(byCheck)
    });
  } catch (e) { next(e); }
};
