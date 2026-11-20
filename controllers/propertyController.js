const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const Property = require('../models/Property');
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');
const mailer = require('../services/mailer');
const { calcTotalMoveIn } = require('../utils/format');

const REQUIRED = ['title', 'propertyType', 'state', 'area', 'annualRent', 'bedrooms', 'bathrooms', 'description'];

async function processImages(files) {
  const urls = [];
  const hashes = [];
  for (const f of files) {
    const hash = crypto.createHash('sha256').update(f.buffer).digest('hex').slice(0, 32);
    hashes.push(hash);
    const filename = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
    const outPath = path.join(__dirname, '..', 'uploads', filename);
    await sharp(f.buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 78 }).toFile(outPath);
    urls.push(`/uploads/${filename}`);
  }
  return { urls, primaryHash: hashes[0] };
}

exports.create = async (req, res, next) => {
  try {
    const b = req.body;
    for (const k of REQUIRED) {
      if (!b[k]) return res.status(400).json({ success: false, message: `Missing field: ${k}` });
    }
    if (!req.files || req.files.length < 1) return res.status(400).json({ success: false, message: 'At least one photo is required' });
    if (req.files.length > 5) return res.status(400).json({ success: false, message: 'Maximum 5 photos allowed' });

    const { urls, primaryHash } = await processImages(req.files);

    const annualRent = Number(b.annualRent);
    const agencyFee = Number(b.agencyFee || 0);
    const legalFee = Number(b.legalFee || 0);
    const cautionDeposit = Number(b.cautionDeposit || 0);
    const totalMoveInCost = calcTotalMoveIn({ annualRent, agencyFee, legalFee, cautionDeposit });

    const amenities = b.amenities
      ? (Array.isArray(b.amenities) ? b.amenities : b.amenities.split(',').map(s => s.trim()).filter(Boolean))
      : [];

    const property = new Property({
      title: b.title, propertyType: b.propertyType, state: b.state, area: b.area,
      address: b.address, annualRent, bedrooms: Number(b.bedrooms), bathrooms: Number(b.bathrooms),
      description: b.description, amenities, photos: urls,
      agencyFee, legalFee, cautionDeposit, totalMoveInCost,
      lister: req.user._id, listerType: b.listerType || 'agent',
      status: 'Pending',
      photoHash: primaryHash
    });
    property.appendReview({ action: 'submitted', by: req.user._id, byRole: 'lister', note: 'Submitted for review' });
    await property.save();

    res.status(201).json({ success: true, property, message: 'Listing submitted for review.' });
  } catch (e) { next(e); }
};

exports.listPublished = async (req, res, next) => {
  try {
    const { state, area, propertyType, minRent, maxRent, bedrooms, bathrooms, reviewedOnly, keyword, sort, page = 1, limit = 12, neLat, neLng, swLat, swLng } = req.query;
    const q = { status: 'Published' };
    if (state) q.state = new RegExp(`^${state}$`, 'i');
    if (area) q.area = new RegExp(`^${area}$`, 'i');
    if (propertyType) q.propertyType = propertyType;
    if (minRent || maxRent) {
      q.annualRent = {};
      if (minRent) q.annualRent.$gte = Number(minRent);
      if (maxRent) q.annualRent.$lte = Number(maxRent);
    }
    if (bedrooms) q.bedrooms = { $gte: Number(bedrooms) };
    if (bathrooms) q.bathrooms = { $gte: Number(bathrooms) };
    if (reviewedOnly === 'true') q.reviewedAt = { $ne: null };
    if (keyword) {
      q.$or = [
        { title: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') },
        { area: new RegExp(keyword, 'i') }
      ];
    }
    // Map bounds filter
    if (neLat && neLng && swLat && swLng) {
      q.coordinates = {
        $geoWithin: {
          $box: [[Number(swLng), Number(swLat)], [Number(neLng), Number(neLat)]]
        }
      };
    }
    const sorts = { newest: { createdAt: -1 }, price_asc: { annualRent: 1 }, price_desc: { annualRent: -1 } };
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Property.find(q).sort(sorts[sort] || sorts.newest).skip(skip).limit(Number(limit)).populate('lister', 'name role'),
      Property.countDocuments(q)
    ]);
    res.json({ success: true, data: items, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const p = await Property.findById(req.params.id).populate('lister', 'name phone role');
    if (!p) return res.status(404).json({ success: false, message: 'Listing not found' });
    const isOwner = req.user && String(p.lister._id) === String(req.user._id);
    const isAdmin = req.user && req.user.role === 'admin';
    if (p.status !== 'Published' && !isOwner && !isAdmin) {
      return res.status(404).json({ success: false, message: 'Listing not available' });
    }
    res.json({ success: true, property: p });
  } catch (e) { next(e); }
};

exports.myListings = async (req, res, next) => {
  try {
    const items = await Property.find({ lister: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

exports.updateOwn = async (req, res, next) => {
  try {
    const p = await Property.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (String(p.lister) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own listings' });
    }
    const b = req.body;
    const priceChanged =
      (b.annualRent !== undefined && Number(b.annualRent) !== p.annualRent) ||
      (b.agencyFee !== undefined && Number(b.agencyFee) !== p.agencyFee) ||
      (b.legalFee !== undefined && Number(b.legalFee) !== p.legalFee) ||
      (b.cautionDeposit !== undefined && Number(b.cautionDeposit) !== p.cautionDeposit);

    const fields = ['title', 'propertyType', 'state', 'area', 'address', 'description', 'bedrooms', 'bathrooms', 'annualRent', 'agencyFee', 'legalFee', 'cautionDeposit', 'listerType'];
    fields.forEach(f => { if (b[f] !== undefined) p[f] = b[f]; });
    if (b.amenities) p.amenities = Array.isArray(b.amenities) ? b.amenities : b.amenities.split(',').map(s => s.trim()).filter(Boolean);
    p.totalMoveInCost = calcTotalMoveIn(p);

    if (priceChanged) {
      p.appendPriceChange({ changedBy: req.user._id, changedByRole: 'lister', reason: 'Price updated by lister' });
      p.appendReview({ action: 'price_changed', by: req.user._id, byRole: 'lister', note: `Price updated to ${p.annualRent}` });
    } else {
      p.appendReview({ action: 'updated', by: req.user._id, byRole: 'lister', note: 'Listing updated' });
    }

    if (req.files && req.files.length) {
      const { urls, primaryHash } = await processImages(req.files);
      p.photos = urls;
      p.photoHash = primaryHash;
    }
    await p.save();
    res.json({ success: true, property: p });
  } catch (e) { next(e); }
};

exports.updatePrice = async (req, res, next) => {
  try {
    const { annualRent, agencyFee, legalFee, cautionDeposit, reason } = req.body;
    const p = await Property.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (String(p.lister) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const before = { annualRent: p.annualRent, agencyFee: p.agencyFee, legalFee: p.legalFee, cautionDeposit: p.cautionDeposit };

    if (annualRent !== undefined) p.annualRent = Number(annualRent);
    if (agencyFee !== undefined) p.agencyFee = Number(agencyFee);
    if (legalFee !== undefined) p.legalFee = Number(legalFee);
    if (cautionDeposit !== undefined) p.cautionDeposit = Number(cautionDeposit);
    p.totalMoveInCost = calcTotalMoveIn(p);

    const changed = before.annualRent !== p.annualRent ||
                    before.agencyFee !== p.agencyFee ||
                    before.legalFee !== p.legalFee ||
                    before.cautionDeposit !== p.cautionDeposit;

    if (changed) {
      p.appendPriceChange({
        changedBy: req.user._id,
        changedByRole: req.user.role === 'admin' ? 'admin' : 'lister',
        reason: reason || 'Price updated'
      });
      p.appendReview({
        action: 'price_changed',
        by: req.user._id,
        byRole: req.user.role === 'admin' ? 'admin' : 'lister',
        note: reason || `Price updated to ${p.annualRent}`
      });
      await p.save();
    }

    res.json({ success: true, property: p });
  } catch (e) { next(e); }
};

exports.markRented = async (req, res, next) => {
  try {
    const p = await Property.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (String(p.lister) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Forbidden' });
    p.status = 'Rented';
    p.appendReview({ action: 'updated', by: req.user._id, byRole: 'lister', note: 'Marked as rented' });
    await p.save();
    res.json({ success: true, property: p });
  } catch (e) { next(e); }
};

exports.adminApprove = async (req, res, next) => {
  try {
    const p = await Property.findById(req.params.id).populate('lister', 'name email');
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    p.appendReview({ action: 'approved', by: req.user._id, byRole: 'admin', note: req.body.note || 'Approved' });
    await p.save();
    await mailer.sendListingApproved(p.lister, p);
    res.json({ success: true, property: p });
  } catch (e) { next(e); }
};

exports.adminReject = async (req, res, next) => {
  try {
    const reason = req.body.reason || 'Listing does not meet requirements';
    const p = await Property.findById(req.params.id).populate('lister', 'name email');
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    p.appendReview({ action: 'rejected', by: req.user._id, byRole: 'admin', note: reason });
    await p.save();
    await mailer.sendListingRejected(p.lister, p, reason);
    res.json({ success: true, property: p });
  } catch (e) { next(e); }
};

exports.adminUnpublish = async (req, res, next) => {
  try {
    const p = await Property.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    p.appendReview({ action: 'unpublished', by: req.user._id, byRole: 'admin', note: req.body.adminNote || 'Unpublished by admin' });
    await p.save();
    res.json({ success: true, property: p });
  } catch (e) { next(e); }
};

exports.adminRestore = async (req, res, next) => {
  try {
    const p = await Property.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    p.appendReview({ action: 'restored', by: req.user._id, byRole: 'admin', note: 'Restored by admin' });
    await p.save();
    res.json({ success: true, property: p });
  } catch (e) { next(e); }
};

