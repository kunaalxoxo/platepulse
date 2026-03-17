const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Donation = require('../models/Donation');
const Mission = require('../models/Mission');
const Product = require('../models/Product');
const Order = require('../models/Order');
const CommunityShare = require('../models/CommunityShare');
const WasteRequest = require('../models/WasteRequest');
const ImpactLog = require('../models/ImpactLog');

const SEED_KEY = 'platepulse_seed_2026';

const LOCATIONS = {
  banjara_hills: { coordinates: [78.4483, 17.4126], address: 'Road No. 12, Banjara Hills, Hyderabad, Telangana' },
  jubilee_hills: { coordinates: [78.4068, 17.4321], address: 'Film Nagar Road, Jubilee Hills, Hyderabad, Telangana' },
  hitech_city: { coordinates: [78.3816, 17.4498], address: 'Cyber Towers, HITEC City, Hyderabad, Telangana' },
  secunderabad: { coordinates: [78.4983, 17.4399], address: 'MG Road, Secunderabad, Hyderabad, Telangana' },
  old_city: { coordinates: [78.4740, 17.3616], address: 'Charminar Road, Old City, Hyderabad, Telangana' },
  gachibowli: { coordinates: [78.3428, 17.4401], address: 'DLF Cyber City, Gachibowli, Hyderabad, Telangana' },
  kompally: { coordinates: [78.4863, 17.5410], address: 'Kompally Main Road, Medchal, Hyderabad, Telangana' },
  lb_nagar: { coordinates: [78.5535, 17.3490], address: 'LB Nagar Circle, Hyderabad, Telangana' },
};

const hrs = (n) => new Date(Date.now() + n * 3600000);
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

exports.runSeed = async (req, res) => {
  console.log('🌱 SEED REQUEST RECEIVED', { key: req.query.key, timestamp: new Date() });

  if (req.query.key !== SEED_KEY) {
    console.log('❌ INVALID KEY', req.query.key);
    return res.status(403).json({ success: false, message: 'Invalid seed key' });
  }

  try {
    console.log('🧹 WIPING DATABASE...');
    await Promise.all([
      User.deleteMany({}),
      Donation.deleteMany({}),
      Mission.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      CommunityShare.deleteMany({}),
      WasteRequest.deleteMany({}),
      ImpactLog.deleteMany({}),
    ]);

    const pw = await bcrypt.hash('Password@123', 12);
    console.log('🔐 PASSWORD HASHED');

    console.log('👥 CREATING USERS...');
    const [admin, donor1, donor2, donor3, ngo1, ngo2, vol1, vol2, vol3, retail1, retail2, consumer1, consumer2, wastePlant1] = await User.insertMany([
      {
        name: 'Karthik Reddy',
        email: 'admin@platepulse.in',
        password: pw,
        role: 'admin',
        phone: '9876543210',
        orgName: 'PlatePulse HQ',
        location: { type: 'Point', ...LOCATIONS.hitech_city },
        isVerified: true,
        trustScore: 100,
        points: 9999,
        badge: 'hero',
      },
      {
        name: 'Priya Sharma',
        email: 'priya.donor@gmail.com',
        password: pw,
        role: 'donor',
        phone: '9876500001',
        orgName: 'Taj Falaknuma Palace Banquets',
        location: { type: 'Point', ...LOCATIONS.banjara_hills },
        isVerified: true,
        trustScore: 88,
        points: 750,
        badge: 'gold',
      },
      {
        name: 'Rahul Gupta',
        email: 'rahul.donor@gmail.com',
        password: pw,
        role: 'donor',
        phone: '9876500002',
        orgName: 'Rahul Wedding & Events Catering',
        location: { type: 'Point', ...LOCATIONS.jubilee_hills },
        isVerified: true,
        trustScore: 75,
        points: 320,
        badge: 'silver',
      },
      {
        name: 'Deepika Rao',
        email: 'deepika.donor@gmail.com',
        password: pw,
        role: 'donor',
        phone: '9876500003',
        orgName: 'Deepika Home Kitchen',
        location: { type: 'Point', ...LOCATIONS.gachibowli },
        isVerified: true,
        trustScore: 65,
        points: 80,
        badge: 'bronze',
      },
      {
        name: "Father Thomas D'Cruz",
        email: 'thomas.ngo@rotibank.org',
        password: pw,
        role: 'ngo',
        phone: '9876500004',
        orgName: 'Roti Bank Hyderabad',
        location: { type: 'Point', ...LOCATIONS.secunderabad },
        isVerified: true,
        trustScore: 95,
        points: 1200,
        badge: 'hero',
      },
      {
        name: 'Sameena Begum',
        email: 'sameena.ngo@feedhyd.org',
        password: pw,
        role: 'ngo',
        phone: '9876500005',
        orgName: 'Feed Hyderabad Foundation',
        location: { type: 'Point', ...LOCATIONS.old_city },
        isVerified: true,
        trustScore: 89,
        points: 540,
        badge: 'gold',
      },
      {
        name: 'Aakash Verma',
        email: 'aakash.vol@gmail.com',
        password: pw,
        role: 'volunteer',
        phone: '9876500006',
        location: { type: 'Point', ...LOCATIONS.banjara_hills },
        isVerified: true,
        trustScore: 82,
        points: 610,
        badge: 'gold',
        isAvailable: true,
      },
      {
        name: 'Sneha Kulkarni',
        email: 'sneha.vol@gmail.com',
        password: pw,
        role: 'volunteer',
        phone: '9876500007',
        location: { type: 'Point', ...LOCATIONS.lb_nagar },
        isVerified: true,
        trustScore: 70,
        points: 210,
        badge: 'silver',
        isAvailable: true,
      },
      {
        name: 'Naveen Chandra',
        email: 'naveen.vol@gmail.com',
        password: pw,
        role: 'volunteer',
        phone: '9876500008',
        location: { type: 'Point', ...LOCATIONS.gachibowli },
        isVerified: true,
        trustScore: 60,
        points: 55,
        badge: 'bronze',
        isAvailable: false,
      },
      {
        name: 'Suresh Agarwal',
        email: 'suresh.retail@morehyd.com',
        password: pw,
        role: 'retail',
        phone: '9876500009',
        orgName: 'More Supermarket — Banjara Hills',
        location: { type: 'Point', ...LOCATIONS.banjara_hills },
        isVerified: true,
        trustScore: 91,
        points: 0,
      },
      {
        name: 'Lakshmi Naidu',
        email: 'lakshmi.retail@organic-hyd.com',
        password: pw,
        role: 'retail',
        phone: '9876500010',
        orgName: "Nature's Basket Organic Store — Gachibowli",
        location: { type: 'Point', ...LOCATIONS.gachibowli },
        isVerified: true,
        trustScore: 84,
        points: 0,
      },
      {
        name: 'Vikram Mehta',
        email: 'vikram.consumer@gmail.com',
        password: pw,
        role: 'consumer',
        phone: '9876500011',
        location: { type: 'Point', ...LOCATIONS.hitech_city },
        isVerified: true,
        trustScore: 70,
        points: 0,
      },
      {
        name: 'Meghana Iyer',
        email: 'meghana.consumer@gmail.com',
        password: pw,
        role: 'consumer',
        phone: '9876500012',
        location: { type: 'Point', ...LOCATIONS.jubilee_hills },
        isVerified: true,
        trustScore: 70,
        points: 0,
      },
      {
        name: 'Ramesh Babu',
        email: 'ramesh.waste@ghmc.gov.in',
        password: pw,
        role: 'waste_plant',
        phone: '9876500013',
        orgName: 'GHMC Bio-Compost Plant — Jawaharnagar',
        location: { type: 'Point', ...LOCATIONS.kompally },
        isVerified: true,
        trustScore: 90,
        points: 0,
      },
    ]);

    console.log('🍽️ CREATING DONATIONS...');
    const donations = await Donation.insertMany([
      {
        donor: donor1._id,
        name: 'Hyderabadi Dum Biryani & Mirchi Ka Salan (Wedding Surplus)',
        category: 'cooked',
        quantity: 100,
        quantityUnit: 'portions',
        aiValidated: true,
        aiConfidence: 95,
        preparedAt: new Date(Date.now() - 1 * 3600000),
        expiresAt: hrs(22),
        pickupLocation: { type: 'Point', ...LOCATIONS.banjara_hills },
        status: 'available',
      },
      {
        donor: donor2._id,
        name: 'Osmania Biscuits & Irani Chai Snacks (Bakery Surplus)',
        category: 'bakery',
        quantity: 20,
        quantityUnit: 'boxes',
        aiValidated: true,
        aiConfidence: 87,
        preparedAt: daysAgo(1),
        expiresAt: hrs(4),
        pickupLocation: { type: 'Point', ...LOCATIONS.jubilee_hills },
        status: 'available',
      },
      {
        donor: donor1._id,
        name: 'Paneer Tikka Masala + Butter Naan',
        category: 'cooked',
        quantity: 45,
        quantityUnit: 'portions',
        aiValidated: true,
        aiConfidence: 92,
        preparedAt: new Date(Date.now() - 5 * 3600000),
        expiresAt: hrs(18),
        pickupLocation: { type: 'Point', ...LOCATIONS.banjara_hills },
        status: 'available',
      },
    ]);

    console.log('✅ SEED COMPLETE');
    return res.status(200).json({
      success: true,
      message: '✅ Database seeded successfully!',
      data: {
        users: 14,
        donations: 3,
        testAccounts: {
          admin: 'admin@platepulse.in',
          donor: 'priya.donor@gmail.com',
          password: 'Password@123',
        },
      },
    });
  } catch (err) {
    console.error('❌ SEED ERROR:', err);
    return res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
};
