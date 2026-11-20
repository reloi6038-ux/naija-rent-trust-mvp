const Property = require('../models/Property');

// Nigerian state → common misspellings / alternatives
const SYNONYMS = {
  lagos: ['lag', 'lagos state', 'eko', 'ikeja', 'lekki', 'yaba', 'surulere', 'ajah'],
  abuja: ['fct', 'abuja fct', 'federal capital territory', 'gwagwalada', 'wuse', 'maitama'],
  rivers: ['ph', 'port harcourt', 'portharcourt'],
  oyo: ['ibadan'],
  enugu: ['enugu state'],
  edo: ['benin city', 'benin'],
  delta: ['asaba', 'warri']
};

/**
 * GET /api/search/advanced
 * Supports: q (fuzzy), state, area, type, minRent, maxRent, beds, baths, amenities[], reviewed, sort, page, limit
 */
exports.advanced = async (req, res, next) => {
  try {
    const {
      q, state, area, propertyType, minRent, maxRent, bedrooms, bathrooms,
      amenities, reviewed, sort = 'newest', page = 1, limit = 12
    } = req.query;

    const match = { status: 'Published' };

    if (state) match.state = new RegExp(`^${state}$`, 'i');
    if (area) match.area = new RegExp(area, 'i');
    if (propertyType) match.propertyType = propertyType;
    if (minRent || maxRent) {
      match.annualRent = {};
      if (minRent) match.annualRent.$gte = Number(minRent);
      if (maxRent) match.annualRent.$lte = Number(maxRent);
    }
    if (bedrooms) match.bedrooms = { $gte: Number(bedrooms) };
    if (bathrooms) match.bathrooms = { $gte: Number(bathrooms) };
    if (reviewed === 'true') match.reviewedAt = { $ne: null };
    if (amenities) {
      const list = (Array.isArray(amenities) ? amenities : amenities.split(','))
        .map(a => a.trim()).filter(Boolean);
      if (list.length) match.amenities = { $all: list.map(a => new RegExp(`^${a}$`, 'i')) };
    }

    // Fuzzy keyword: expand synonyms and search $or
    if (q && q.trim()) {
      const norm = q.trim().toLowerCase();
      const terms = new Set([norm]);

      // Synonym expansion
      for (const [canonical, list] of Object.entries(SYNONYMS)) {
        if (norm === canonical || list.includes(norm)) {
          terms.add(canonical);
          list.forEach(t => terms.add(t));
        }
      }

      const ors = [];
      for (const term of terms) {
        ors.push({ title: new RegExp(term, 'i') });
        ors.push({ description: new RegExp(term, 'i') });
        ors.push({ area: new RegExp(term, 'i') });
        ors.push({ state: new RegExp(term, 'i') });
      }
      match.$or = ors;
    }

    const sorts = {
      newest: { createdAt: -1 },
      price_asc: { annualRent: 1 },
      price_desc: { annualRent: -1 },
      reviewed: { reviewedAt: -1 },
      condition: { conditionScore: -1 }
    };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Property.find(match).sort(sorts[sort] || sorts.newest).skip(skip).limit(Number(limit)),
      Property.countDocuments(match)
    ]);

    // Facets: count by state, type, and price bucket
    const facets = await Property.aggregate([
      { $match: match },
      {
        $facet: {
          byState: [{ $group: { _id: '$state', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          byType: [{ $group: { _id: '$propertyType', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          byBedrooms: [{ $group: { _id: '$bedrooms', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
          priceRange: [
            {
              $bucket: {
                groupBy: '$annualRent',
                boundaries: [0, 500000, 1000000, 2000000, 5000000, 10000000, 100000000],
                default: 'Other',
                output: { count: { $sum: 1 } }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      facets: facets[0]
    });
  } catch (e) { next(e); }
};

/**
 * GET /api/search/suggestions?q=lek
 * Returns top matching areas and titles for autocomplete.
 */
exports.suggestions = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) return res.json({ success: true, areas: [], titles: [] });

    const [areas, titles] = await Promise.all([
      Property.distinct('area', { status: 'Published', area: new RegExp(q, 'i') }),
      Property.find({ status: 'Published', title: new RegExp(q, 'i') })
        .limit(6)
        .select('title _id')
        .lean()
    ]);

    res.json({
      success: true,
      areas: areas.slice(0, 6),
      titles: titles.map(t => ({ id: t._id, title: t.title }))
    });
  } catch (e) { next(e); }
};
