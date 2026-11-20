require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('../models/Property');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected. Running migration v2...');

    // 1. Properties: strip old verification field, add reviewedAt + reviewHistory
    const props = await Property.find({});
    let touched = 0;
    for (const p of props) {
      const doc = p.toObject();
      const old = doc.verification || {};
      const hadVerified = old.isVerified;
      delete doc.verification;

      if (!doc.reviewHistory || !doc.reviewHistory.length) {
        if (hadVerified) {
          doc.reviewHistory = [{
            action: 'approved',
            byRole: 'system',
            note: 'Migrated from demo simulated verification',
            at: old.verifiedAt || new Date()
          }];
          doc.reviewedAt = old.verifiedAt || new Date();
        } else {
          doc.reviewHistory = [{
            action: 'submitted',
            byRole: 'system',
            note: 'Migrated from demo data',
            at: doc.createdAt || new Date()
          }];
        }
      }

      // Mark old published listings as Published (they were "simulated verified" = published)
      if (doc.status === 'Published' && !doc.reviewedAt) {
        doc.reviewedAt = doc.createdAt || new Date();
        doc.reviewHistory.push({
          action: 'approved',
          byRole: 'system',
          note: 'Migrated published listing',
          at: doc.reviewedAt
        });
      }

      await Property.replaceOne({ _id: doc._id }, doc, { overwriteDiscriminatorKey: true });
      touched++;
    }
    console.log(`Migrated ${touched} properties`);

    // 2. Users: set emailVerified=true for existing demo users (they were "verified" by seed)
    const u = await User.updateMany(
      { emailVerified: { $ne: true } },
      { $set: { emailVerified: true, consentedToTermsAt: new Date(), consentedToPrivacyAt: new Date() } }
    );
    console.log(`Marked ${u.modifiedCount} users as email-verified (demo carry-over)`);

    console.log('Migration complete. ⚠️ Review data manually before going live.');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
})();
