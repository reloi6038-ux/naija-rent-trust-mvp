require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = require('../config/env');
const User = require('../models/User');
const Property = require('../models/Property');
const Enquiry = require('../models/Enquiry');
const Report = require('../models/Report');

const CHECKLIST = [
  { key: 'documents', label: 'Documents reviewed — SIMULATED', done: false },
  { key: 'visited', label: 'Property visited — SIMULATED', done: false },
  { key: 'lister', label: 'Lister information reviewed — SIMULATED', done: false },
  { key: 'details', label: 'Listing details checked — SIMULATED', done: false }
];

const PROPS = [
  { title: 'Spacious Self Contain in Yaba', propertyType: 'Self Contain', state: 'Lagos', area: 'Yaba', annualRent: 450000, bedrooms: 1, bathrooms: 1, description: 'Neat self contain in Yaba with water and security.', amenities: ['Water', 'Security'], agencyFee: 45000, legalFee: 30000, cautionDeposit: 50000, verified: true },
  { title: 'Mini Flat near University of Lagos', propertyType: 'Mini Flat', state: 'Lagos', area: 'Akoka', annualRent: 850000, bedrooms: 1, bathrooms: 1, description: 'Quiet mini flat ideal for students and professionals.', amenities: ['Water', 'Parking'], agencyFee: 85000, legalFee: 50000, cautionDeposit: 100000, verified: true },
  { title: 'Modern 2-Bed Flat in Lekki Phase 1', propertyType: 'Flat', state: 'Lagos', area: 'Lekki', annualRent: 2400000, bedrooms: 2, bathrooms: 2, description: 'Modern 2-bedroom flat with fitted kitchen and 24/7 power.', amenities: ['Water', 'Security', 'Parking', 'Generator'], agencyFee: 200000, legalFee: 120000, cautionDeposit: 200000, verified: true },
  { title: '3-Bedroom Duplex in Ikeja GRA', propertyType: 'Duplex', state: 'Lagos', area: 'Ikeja', annualRent: 5000000, bedrooms: 3, bathrooms: 3, description: 'Elegant duplex in Ikeja GRA with spacious compound.', amenities: ['Water', 'Security', 'Parking'], agencyFee: 400000, legalFee: 250000, cautionDeposit: 500000, verified: false },
  { title: 'Cosy Mini Flat in Surulere', propertyType: 'Mini Flat', state: 'Lagos', area: 'Surulere', annualRent: 700000, bedrooms: 1, bathrooms: 1, description: 'Cosy mini flat close to shops and transport.', amenities: ['Water'], agencyFee: 70000, legalFee: 40000, cautionDeposit: 80000, verified: false },
  { title: 'Detached House in Maitama', propertyType: 'Detached House', state: 'FCT Abuja', area: 'Maitama', annualRent: 12000000, bedrooms: 4, bathrooms: 4, description: 'Spacious detached house in a prime Abuja location.', amenities: ['Water', 'Security', 'Parking', 'Generator'], agencyFee: 900000, legalFee: 600000, cautionDeposit: 1200000, verified: true },
  { title: 'Self Contain in Wuse 2', propertyType: 'Self Contain', state: 'FCT Abuja', area: 'Wuse', annualRent: 600000, bedrooms: 1, bathrooms: 1, description: 'Neat self contain close to businesses in Wuse 2.', amenities: ['Water', 'Security'], agencyFee: 60000, legalFee: 40000, cautionDeposit: 70000, verified: false },
  { title: '2-Bed Flat in Gwarinpa', propertyType: 'Flat', state: 'FCT Abuja', area: 'Gwarinpa', annualRent: 1800000, bedrooms: 2, bathrooms: 2, description: 'Comfortable 2-bed flat with ample parking.', amenities: ['Water', 'Parking', 'Security'], agencyFee: 180000, legalFee: 100000, cautionDeposit: 200000, verified: true },
  { title: 'Terraced House in GRA Port Harcourt', propertyType: 'Terraced House', state: 'Rivers', area: 'Port Harcourt', annualRent: 2500000, bedrooms: 3, bathrooms: 3, description: 'Nice terraced house in Port Harcourt GRA.', amenities: ['Water', 'Security'], agencyFee: 250000, legalFee: 150000, cautionDeposit: 300000, verified: false },
  { title: 'Mini Flat in Rumuokoro', propertyType: 'Mini Flat', state: 'Rivers', area: 'Rumuokoro', annualRent: 900000, bedrooms: 1, bathrooms: 1, description: 'Affordable mini flat in Rumuokoro.', amenities: ['Water'], agencyFee: 90000, legalFee: 50000, cautionDeposit: 100000, verified: false },
  { title: 'Flat in Enugu GRA', propertyType: 'Flat', state: 'Enugu', area: 'Enugu GRA', annualRent: 1200000, bedrooms: 2, bathrooms: 2, description: 'Well-maintained flat in Enugu GRA.', amenities: ['Water', 'Security'], agencyFee: 120000, legalFee: 70000, cautionDeposit: 150000, verified: true },
  { title: 'Self Contain in Ibadan Bodija', propertyType: 'Self Contain', state: 'Oyo', area: 'Bodija', annualRent: 350000, bedrooms: 1, bathrooms: 1, description: 'Quiet self contain in Bodija, Ibadan.', amenities: ['Water'], agencyFee: 35000, legalFee: 20000, cautionDeposit: 40000, verified: false },
  { title: 'Duplex in Ibadan Jericho', propertyType: 'Duplex', state: 'Oyo', area: 'Jericho', annualRent: 3500000, bedrooms: 4, bathrooms: 4, description: 'Family duplex in Jericho with large compound.', amenities: ['Water', 'Security', 'Parking'], agencyFee: 350000, legalFee: 200000, cautionDeposit: 400000, verified: true },
  { title: 'Mini Flat in Benin City', propertyType: 'Mini Flat', state: 'Edo', area: 'Ugbowo', annualRent: 550000, bedrooms: 1, bathrooms: 1, description: 'Affordable mini flat close to UNIBEN.', amenities: ['Water', 'Security'], agencyFee: 55000, legalFee: 30000, cautionDeposit: 60000, verified: false },
  { title: 'Flat in Asaba', propertyType: 'Flat', state: 'Delta', area: 'Asaba', annualRent: 1000000, bedrooms: 2, bathrooms: 2, description: 'Modern 2-bed flat in Asaba.', amenities: ['Water', 'Parking'], agencyFee: 100000, legalFee: 60000, cautionDeposit: 120000, verified: true }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected. Seeding...');

    await Promise.all([User.deleteMany({}), Property.deleteMany({}), Enquiry.deleteMany({}), Report.deleteMany({})]);

    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const admin = await User.create({ name: 'Demo Admin', email: ADMIN_EMAIL, phone: '+2348000000000', passwordHash: adminHash, role: 'admin' });

    const listerHash = await bcrypt.hash('ListerDemo123!', 12);
    const listers = await User.create([
      { name: 'Ada Demo Lister', email: 'ada@naijarent.demo', phone: '+2348011111111', passwordHash: listerHash, role: 'lister' },
      { name: 'Chidi Demo Lister', email: 'chidi@naijarent.demo', phone: '+2348022222222', passwordHash: listerHash, role: 'lister' },
      { name: 'Ngozi Demo Lister', email: 'ngozi@naijarent.demo', phone: '+2348033333333', passwordHash: listerHash, role: 'lister' }
    ]);

    const photos = ['/images/placeholder.svg'];
    const props = PROPS.map((p, i) => ({
      ...p,
      photos,
      totalMoveInCost: p.annualRent + p.agencyFee + p.legalFee + p.cautionDeposit,
      lister: listers[i % listers.length]._id,
      listerType: i % 2 === 0 ? 'agent' : 'landlord',
      status: 'Published',
      verification: {
        isVerified: !!p.verified,
        verificationLabel: 'Simulated Verification — Demo Only',
        checklist: CHECKLIST.map(c => ({ ...c, done: !!p.verified })),
        verifiedBy: p.verified ? admin._id : undefined,
        verifiedAt: p.verified ? new Date() : undefined
      },
      address: 'Fictional address for demo',
      adminNote: ''
    }));

    const created = await Property.insertMany(props);
    console.log(`Seeded ${created.length} properties, ${listers.length} listers, 1 admin`);

    // Sample enquiry
    await Enquiry.create({
      property: created[0]._id, lister: created[0].lister,
      renterName: 'Demo Renter', renterPhone: '+2348044444444', renterEmail: 'renter@naijarent.demo',
      message: 'Is this still available? I would like to schedule an inspection.', status: 'New'
    });

    // Sample report
    await Report.create({ property: created[3]._id, reason: 'Wrong price', comment: 'Demo report for testing.', status: 'Open' });

    console.log('Seeding complete.');
    console.log('Admin:', ADMIN_EMAIL, '/', ADMIN_PASSWORD);
    console.log('Lister:', 'ada@naijarent.demo / ListerDemo123!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}
seed();

