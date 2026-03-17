/**
 * ONE-TIME SEED CONTROLLER
 * Route: GET /api/v1/seed?key=platepulse_seed_2026
 * DELETE THIS FILE AFTER SEEDING.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User           = require('../models/User');
const Donation       = require('../models/Donation');
const Mission        = require('../models/Mission');
const Product        = require('../models/Product');
const Order          = require('../models/Order');
const CommunityShare = require('../models/CommunityShare');
const WasteRequest   = require('../models/WasteRequest');
const ImpactLog      = require('../models/ImpactLog');

const SEED_KEY = 'platepulse_seed_2026';

const LOCATIONS = {
  banjara_hills:  { coordinates: [78.4483, 17.4126], address: 'Road No. 12, Banjara Hills, Hyderabad, Telangana' },
  jubilee_hills:  { coordinates: [78.4068, 17.4321], address: 'Film Nagar Road, Jubilee Hills, Hyderabad, Telangana' },
  hitech_city:    { coordinates: [78.3816, 17.4498], address: 'Cyber Towers, HITEC City, Hyderabad, Telangana' },
  secunderabad:   { coordinates: [78.4983, 17.4399], address: 'MG Road, Secunderabad, Hyderabad, Telangana' },
  old_city:       { coordinates: [78.4740, 17.3616], address: 'Charminar Road, Old City, Hyderabad, Telangana' },
  gachibowli:     { coordinates: [78.3428, 17.4401], address: 'DLF Cyber City, Gachibowli, Hyderabad, Telangana' },
  kompally:       { coordinates: [78.4863, 17.5410], address: 'Kompally Main Road, Medchal, Hyderabad, Telangana' },
  lb_nagar:       { coordinates: [78.5535, 17.3490], address: 'LB Nagar Circle, Hyderabad, Telangana' },
};

const hrs     = (n) => new Date(Date.now() + n * 3600000);
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

const runSeed = async (req, res) => {
  if (req.query.key !== SEED_KEY) {
    return res.status(403).json({ success: false, message: 'Invalid seed key' });
  }

  try {
    // ── WIPE ──────────────────────────────────────────────────────
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

    // ── USERS ─────────────────────────────────────────────────────
    const [admin, donor1, donor2, donor3, ngo1, ngo2, vol1, vol2, vol3,
           retail1, retail2, consumer1, consumer2, wastePlant1] =
      await User.insertMany([
        {
          name: 'Karthik Reddy', email: 'admin@platepulse.in', password: pw, role: 'admin',
          phone: '9876543210', orgName: 'PlatePulse HQ',
          location: { type: 'Point', ...LOCATIONS.hitech_city },
          isVerified: true, trustScore: 100, points: 9999, badge: 'hero',
        },
        {
          name: 'Priya Sharma', email: 'priya.donor@gmail.com', password: pw, role: 'donor',
          phone: '9876500001', orgName: 'Taj Falaknuma Palace Banquets',
          location: { type: 'Point', ...LOCATIONS.banjara_hills },
          isVerified: true, trustScore: 88, points: 750, badge: 'gold',
        },
        {
          name: 'Rahul Gupta', email: 'rahul.donor@gmail.com', password: pw, role: 'donor',
          phone: '9876500002', orgName: 'Rahul Wedding & Events Catering',
          location: { type: 'Point', ...LOCATIONS.jubilee_hills },
          isVerified: true, trustScore: 75, points: 320, badge: 'silver',
        },
        {
          name: 'Deepika Rao', email: 'deepika.donor@gmail.com', password: pw, role: 'donor',
          phone: '9876500003', orgName: 'Deepika Home Kitchen',
          location: { type: 'Point', ...LOCATIONS.gachibowli },
          isVerified: true, trustScore: 65, points: 80, badge: 'bronze',
        },
        {
          name: "Father Thomas D'Cruz", email: 'thomas.ngo@rotibank.org', password: pw, role: 'ngo',
          phone: '9876500004', orgName: 'Roti Bank Hyderabad',
          location: { type: 'Point', ...LOCATIONS.secunderabad },
          isVerified: true, trustScore: 95, points: 1200, badge: 'hero',
        },
        {
          name: 'Sameena Begum', email: 'sameena.ngo@feedhyd.org', password: pw, role: 'ngo',
          phone: '9876500005', orgName: 'Feed Hyderabad Foundation',
          location: { type: 'Point', ...LOCATIONS.old_city },
          isVerified: true, trustScore: 89, points: 540, badge: 'gold',
        },
        {
          name: 'Aakash Verma', email: 'aakash.vol@gmail.com', password: pw, role: 'volunteer',
          phone: '9876500006',
          location: { type: 'Point', ...LOCATIONS.banjara_hills },
          isVerified: true, trustScore: 82, points: 610, badge: 'gold', isAvailable: true,
        },
        {
          name: 'Sneha Kulkarni', email: 'sneha.vol@gmail.com', password: pw, role: 'volunteer',
          phone: '9876500007',
          location: { type: 'Point', ...LOCATIONS.lb_nagar },
          isVerified: true, trustScore: 70, points: 210, badge: 'silver', isAvailable: true,
        },
        {
          name: 'Naveen Chandra', email: 'naveen.vol@gmail.com', password: pw, role: 'volunteer',
          phone: '9876500008',
          location: { type: 'Point', ...LOCATIONS.gachibowli },
          isVerified: true, trustScore: 60, points: 55, badge: 'bronze', isAvailable: false,
        },
        {
          name: 'Suresh Agarwal', email: 'suresh.retail@morehyd.com', password: pw, role: 'retail',
          phone: '9876500009', orgName: 'More Supermarket — Banjara Hills',
          location: { type: 'Point', ...LOCATIONS.banjara_hills },
          isVerified: true, trustScore: 91, points: 0,
        },
        {
          name: 'Lakshmi Naidu', email: 'lakshmi.retail@organic-hyd.com', password: pw, role: 'retail',
          phone: '9876500010', orgName: "Nature's Basket Organic Store — Gachibowli",
          location: { type: 'Point', ...LOCATIONS.gachibowli },
          isVerified: true, trustScore: 84, points: 0,
        },
        {
          name: 'Vikram Mehta', email: 'vikram.consumer@gmail.com', password: pw, role: 'consumer',
          phone: '9876500011',
          location: { type: 'Point', ...LOCATIONS.hitech_city },
          isVerified: true, trustScore: 70, points: 0,
        },
        {
          name: 'Meghana Iyer', email: 'meghana.consumer@gmail.com', password: pw, role: 'consumer',
          phone: '9876500012',
          location: { type: 'Point', ...LOCATIONS.jubilee_hills },
          isVerified: true, trustScore: 70, points: 0,
        },
        {
          name: 'Ramesh Babu', email: 'ramesh.waste@ghmc.gov.in', password: pw, role: 'waste_plant',
          phone: '9876500013', orgName: 'GHMC Bio-Compost Plant — Jawaharnagar',
          location: { type: 'Point', ...LOCATIONS.kompally },
          isVerified: true, trustScore: 90, points: 0,
        },
      ]);

    // ── DONATIONS ─────────────────────────────────────────────────
    const donations = await Donation.insertMany([
      {
        donor: donor1._id, name: 'Hyderabadi Dum Biryani & Mirchi Ka Salan (Wedding Surplus)',
        category: 'cooked', quantity: 100, quantityUnit: 'portions',
        image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400',
        aiValidated: true, aiConfidence: 95,
        preparedAt: new Date(Date.now() - 1 * 3600000), expiresAt: hrs(22),
        pickupLocation: { type: 'Point', ...LOCATIONS.banjara_hills },
        status: 'available',
        specialInstructions: 'Hot and sealed in steel containers. Please bring your own boxes.',
      },
      {
        donor: donor2._id, name: 'Osmania Biscuits & Irani Chai Snacks (Bakery Surplus)',
        category: 'bakery', quantity: 20, quantityUnit: 'boxes',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
        aiValidated: true, aiConfidence: 87,
        preparedAt: daysAgo(1), expiresAt: hrs(4),
        pickupLocation: { type: 'Point', ...LOCATIONS.jubilee_hills },
        status: 'available',
        specialInstructions: 'Available from 7 AM. Ring the bell at the side entrance.',
      },
      {
        donor: donor1._id, name: 'Paneer Tikka Masala + Butter Naan',
        category: 'cooked', quantity: 45, quantityUnit: 'portions',
        image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400',
        aiValidated: true, aiConfidence: 92,
        preparedAt: new Date(Date.now() - 5 * 3600000), expiresAt: hrs(18),
        pickupLocation: { type: 'Point', ...LOCATIONS.banjara_hills },
        status: 'available',
      },
      {
        donor: donor3._id, name: 'Mixed Vegetables — Tomatoes, Onions, Capsicum (Wholesale Surplus)',
        category: 'raw', quantity: 15, quantityUnit: 'kg',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
        aiValidated: true, aiConfidence: 97,
        expiresAt: hrs(48),
        pickupLocation: { type: 'Point', ...LOCATIONS.gachibowli },
        status: 'available',
        specialInstructions: 'Sorted and bagged. Pickup from society gate.',
      },
      {
        donor: donor2._id, name: 'Mutton Haleem & Sheermal (Reception Dinner Leftover)',
        category: 'cooked', quantity: 60, quantityUnit: 'portions',
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
        aiValidated: true, aiConfidence: 86,
        preparedAt: new Date(Date.now() - 2 * 3600000), expiresAt: hrs(10),
        pickupLocation: { type: 'Point', ...LOCATIONS.jubilee_hills },
        status: 'matched', assignedTo: ngo1._id,
      },
      {
        donor: donor1._id, name: 'Bagara Baingan + Jowar Roti (Corporate Lunch Surplus)',
        category: 'cooked', quantity: 80, quantityUnit: 'portions',
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400',
        aiValidated: true, aiConfidence: 93,
        preparedAt: new Date(Date.now() - 3 * 3600000), expiresAt: hrs(8),
        pickupLocation: { type: 'Point', ...LOCATIONS.hitech_city },
        status: 'in_transit', assignedTo: vol1._id,
        pickupConfirmedAt: new Date(Date.now() - 30 * 60000),
      },
      {
        donor: donor1._id, name: 'Vegetable Pulao & Raita (Hotel Buffet Surplus)',
        category: 'cooked', quantity: 70, quantityUnit: 'portions',
        aiValidated: true, aiConfidence: 91,
        preparedAt: daysAgo(1),
        expiresAt: new Date(daysAgo(1).getTime() + 8 * 3600000),
        pickupLocation: { type: 'Point', ...LOCATIONS.banjara_hills },
        status: 'delivered', assignedTo: vol1._id,
        pickupConfirmedAt: daysAgo(1),
        deliveryConfirmedAt: new Date(daysAgo(1).getTime() + 2 * 3600000),
        ngoRating: 5,
      },
      {
        donor: donor2._id, name: 'Dal Makhani & Tandoori Roti (Conference Catering)',
        category: 'cooked', quantity: 40, quantityUnit: 'portions',
        aiValidated: true, aiConfidence: 89,
        preparedAt: daysAgo(2),
        expiresAt: new Date(daysAgo(2).getTime() + 10 * 3600000),
        pickupLocation: { type: 'Point', ...LOCATIONS.jubilee_hills },
        status: 'delivered', assignedTo: vol2._id,
        pickupConfirmedAt: daysAgo(2),
        deliveryConfirmedAt: new Date(daysAgo(2).getTime() + 1.5 * 3600000),
        ngoRating: 4,
      },
      {
        donor: donor3._id, name: 'Sambar Rice & Papad (Office Canteen Leftover)',
        category: 'cooked', quantity: 25, quantityUnit: 'portions',
        aiValidated: false, aiConfidence: 52,
        preparedAt: daysAgo(2), expiresAt: daysAgo(1),
        pickupLocation: { type: 'Point', ...LOCATIONS.gachibowli },
        status: 'expired',
      },
      {
        donor: donor1._id, name: 'Chicken Biryani — Bulk Batch (Past Safe Window)',
        category: 'cooked', quantity: 50, quantityUnit: 'portions',
        aiValidated: true, aiConfidence: 38,
        preparedAt: daysAgo(3), expiresAt: daysAgo(2),
        pickupLocation: { type: 'Point', ...LOCATIONS.banjara_hills },
        status: 'wasted',
      },
      {
        donor: donor2._id, name: 'Parle-G & Good Day Biscuit Packets (Corporate Gift Surplus)',
        category: 'packaged', quantity: 10, quantityUnit: 'boxes',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
        aiValidated: true, aiConfidence: 99,
        expiresAt: hrs(72),
        pickupLocation: { type: 'Point', ...LOCATIONS.jubilee_hills },
        status: 'available',
        specialInstructions: 'Factory-sealed boxes. 50 packets per box.',
      },
      {
        donor: donor1._id, name: 'Fresh Paneer & Dahi (Hotel Kitchen Surplus)',
        category: 'dairy', quantity: 6, quantityUnit: 'kg',
        aiValidated: true, aiConfidence: 94,
        expiresAt: hrs(36),
        pickupLocation: { type: 'Point', ...LOCATIONS.banjara_hills },
        status: 'available',
        specialInstructions: 'Keep refrigerated. Pickup before 9 AM only.',
      },
    ]);

    // ── MISSIONS ──────────────────────────────────────────────────
    await Mission.insertMany([
      {
        donation: donations[4]._id, ngoId: ngo1._id,
        pickupAddress: LOCATIONS.jubilee_hills.address,
        pickupLat: LOCATIONS.jubilee_hills.coordinates[1], pickupLng: LOCATIONS.jubilee_hills.coordinates[0],
        deliveryAddress: 'Roti Bank Shelter, Secunderabad, Hyderabad',
        deliveryLat: LOCATIONS.secunderabad.coordinates[1], deliveryLng: LOCATIONS.secunderabad.coordinates[0],
        status: 'pending', pointsReward: 50,
        acceptedAt: new Date(Date.now() - 20 * 60000), qrToken: 'SEED_QR_TOKEN_1',
      },
      {
        donation: donations[5]._id, ngoId: ngo1._id, volunteerId: vol1._id,
        pickupAddress: LOCATIONS.hitech_city.address,
        pickupLat: LOCATIONS.hitech_city.coordinates[1], pickupLng: LOCATIONS.hitech_city.coordinates[0],
        deliveryAddress: 'Roti Bank Shelter, Secunderabad, Hyderabad',
        deliveryLat: LOCATIONS.secunderabad.coordinates[1], deliveryLng: LOCATIONS.secunderabad.coordinates[0],
        status: 'in_transit', pointsReward: 50,
        acceptedAt: new Date(Date.now() - 45 * 60000), qrToken: 'SEED_QR_TOKEN_2',
      },
      {
        donation: donations[6]._id, ngoId: ngo1._id, volunteerId: vol1._id,
        pickupAddress: LOCATIONS.banjara_hills.address,
        pickupLat: LOCATIONS.banjara_hills.coordinates[1], pickupLng: LOCATIONS.banjara_hills.coordinates[0],
        deliveryAddress: 'Roti Bank Shelter, Secunderabad, Hyderabad',
        deliveryLat: LOCATIONS.secunderabad.coordinates[1], deliveryLng: LOCATIONS.secunderabad.coordinates[0],
        status: 'delivered', pointsReward: 50, acceptedAt: daysAgo(1), qrToken: 'SEED_QR_TOKEN_3',
      },
      {
        donation: donations[7]._id, ngoId: ngo2._id, volunteerId: vol2._id,
        pickupAddress: LOCATIONS.jubilee_hills.address,
        pickupLat: LOCATIONS.jubilee_hills.coordinates[1], pickupLng: LOCATIONS.jubilee_hills.coordinates[0],
        deliveryAddress: 'Feed Hyderabad Distribution Centre, Old City',
        deliveryLat: LOCATIONS.old_city.coordinates[1], deliveryLng: LOCATIONS.old_city.coordinates[0],
        status: 'delivered', pointsReward: 50, acceptedAt: daysAgo(2), qrToken: 'SEED_QR_TOKEN_4',
      },
      {
        donation: donations[8]._id, ngoId: ngo2._id,
        pickupAddress: LOCATIONS.gachibowli.address,
        pickupLat: LOCATIONS.gachibowli.coordinates[1], pickupLng: LOCATIONS.gachibowli.coordinates[0],
        deliveryAddress: 'Feed Hyderabad Distribution Centre, Old City',
        deliveryLat: LOCATIONS.old_city.coordinates[1], deliveryLng: LOCATIONS.old_city.coordinates[0],
        status: 'expired', pointsReward: 50, acceptedAt: daysAgo(2), qrToken: 'SEED_QR_TOKEN_5',
      },
    ]);

    // ── PRODUCTS ──────────────────────────────────────────────────
    const calcPct = (exp) => {
      const h = (exp - Date.now()) / 3600000;
      if (h < 24) return 80;
      if (h < 48) return 70;
      if (h < 96) return 40;
      if (h < 168) return 20;
      return 0;
    };
    const mp = (retailer, name, category, mrp, qty, exp, loc, active = true) => {
      const pct = calcPct(exp);
      return {
        retailer: retailer._id, name, category, mrp,
        finalPrice: Math.round(mrp * (1 - pct / 100)),
        discountPercent: pct, quantity: qty, expiresAt: exp,
        storeLocation: { type: 'Point', ...loc },
        isActive: active, urgentBadge: (exp - Date.now()) / 3600000 < 24,
      };
    };

    const products = await Product.insertMany([
      mp(retail1, 'Amul Taaza Toned Milk (500ml)',          'dairy',   28,  40, hrs(10),  LOCATIONS.banjara_hills),
      mp(retail1, 'Mother Dairy Paneer Block (200g)',        'dairy',   68,  12, hrs(18),  LOCATIONS.banjara_hills),
      mp(retail1, 'Britannia Whole Wheat Bread (400g)',      'bakery',  48,  55, hrs(36),  LOCATIONS.banjara_hills),
      mp(retail2, 'English Oven Multigrain Bread (500g)',    'bakery',  58,  20, hrs(42),  LOCATIONS.gachibowli),
      mp(retail1, 'Epigamia Greek Yogurt Mango (90g)',       'dairy',   35,  70, hrs(72),  LOCATIONS.banjara_hills),
      mp(retail2, 'Organic Fresh Methi Bunch',               'produce', 25,  30, hrs(60),  LOCATIONS.gachibowli),
      mp(retail2, 'Cherry Tomatoes Punnet (250g)',           'produce', 50,  18, hrs(80),  LOCATIONS.gachibowli),
      mp(retail1, 'Aashirvaad Multigrain Atta (1kg)',        'grocery', 62,  45, hrs(120), LOCATIONS.banjara_hills),
      mp(retail2, 'Tata Rock Salt (1kg)',                    'grocery', 24, 100, hrs(144), LOCATIONS.gachibowli),
      mp(retail1, 'Paper Boat Aam Panna Juice (250ml x4)',   'beverage',80,  30, hrs(300), LOCATIONS.banjara_hills, false),
      mp(retail2, 'Amul Gold Butter (100g)',                 'dairy',   58,   0, hrs(50),  LOCATIONS.gachibowli),
    ]);

    // ── ORDERS ────────────────────────────────────────────────────
    await Order.insertMany([
      {
        consumer: consumer1._id,
        items: [
          { product: products[0]._id, quantity: 4, price: products[0].finalPrice },
          { product: products[2]._id, quantity: 2, price: products[2].finalPrice },
        ],
        totalAmount: products[0].finalPrice * 4 + products[2].finalPrice * 2,
        paymentStatus: 'paid', paymentId: 'pay_seed_001', razorpayOrderId: 'order_seed_001',
      },
      {
        consumer: consumer2._id,
        items: [
          { product: products[4]._id, quantity: 3, price: products[4].finalPrice },
          { product: products[6]._id, quantity: 2, price: products[6].finalPrice },
        ],
        totalAmount: products[4].finalPrice * 3 + products[6].finalPrice * 2,
        paymentStatus: 'paid', paymentId: 'pay_seed_002', razorpayOrderId: 'order_seed_002',
      },
      {
        consumer: consumer1._id,
        items: [{ product: products[1]._id, quantity: 1, price: products[1].finalPrice }],
        totalAmount: products[1].finalPrice,
        paymentStatus: 'failed', razorpayOrderId: 'order_seed_003',
      },
    ]);

    // ── COMMUNITY SHARES ──────────────────────────────────────────
    await CommunityShare.insertMany([
      {
        postedBy: consumer1._id, name: 'Homemade Hyderabadi Double Ka Meetha',
        category: 'cooked', quantity: 8,
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
        location: { type: 'Point', ...LOCATIONS.hitech_city },
        claimedByLimit: 4, claimedCount: 0, expiresAt: hrs(12), isActive: true,
      },
      {
        postedBy: consumer2._id, name: 'Extra Khichdi & Pickle from Home (Amma Made)',
        category: 'cooked', quantity: 10,
        image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400',
        location: { type: 'Point', ...LOCATIONS.jubilee_hills },
        claimedByLimit: 5, claimedCount: 2, expiresAt: hrs(6), isActive: true,
      },
      {
        postedBy: consumer1._id, name: 'Fresh Mangoes from Our Farm (Banganapalli)',
        category: 'produce', quantity: 15,
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
        location: { type: 'Point', ...LOCATIONS.hitech_city },
        claimedByLimit: 3, claimedCount: 3, expiresAt: hrs(24), isActive: false,
      },
      {
        postedBy: consumer2._id, name: 'Leftover Qubani Ka Meetha (Eid Celebration)',
        category: 'cooked', quantity: 5,
        location: { type: 'Point', ...LOCATIONS.jubilee_hills },
        claimedByLimit: 3, claimedCount: 0, expiresAt: daysAgo(1), isActive: false,
      },
      {
        postedBy: donor3._id, name: 'Garden-grown Curry Leaves, Coriander & Green Chillies',
        category: 'produce', quantity: 4,
        location: { type: 'Point', ...LOCATIONS.gachibowli },
        claimedByLimit: 4, claimedCount: 1, expiresAt: hrs(36), isActive: true,
      },
    ]);

    // ── WASTE REQUESTS ────────────────────────────────────────────
    await WasteRequest.insertMany([
      { donation: donations[8]._id, wastePlant: wastePlant1._id, status: 'pending' },
      {
        donation: donations[9]._id, wastePlant: wastePlant1._id, status: 'confirmed',
        confirmedAt: new Date(Date.now() - 3 * 3600000),
      },
      {
        donation: donations[9]._id, wastePlant: wastePlant1._id, status: 'completed',
        compostKg: 20, biogasLiters: 8, feedKg: 4, confirmedAt: daysAgo(2),
      },
    ]);

    // ── IMPACT LOGS ───────────────────────────────────────────────
    await ImpactLog.insertMany([
      { eventType: 'donation_delivered', quantityKg: 28, mealsSaved: 70,  co2PreventedKg: 70,  referenceId: donations[6]._id },
      { eventType: 'donation_delivered', quantityKg: 16, mealsSaved: 40,  co2PreventedKg: 40,  referenceId: donations[7]._id },
      { eventType: 'donation_delivered', quantityKg: 32, mealsSaved: 80,  co2PreventedKg: 80,  referenceId: donations[5]._id },
      { eventType: 'waste_processed',    quantityKg: 20, co2PreventedKg: 10, compostKg: 20, biogasLiters: 8, referenceId: donations[9]._id },
      { eventType: 'waste_processed',    quantityKg: 10, co2PreventedKg: 5,  compostKg: 8,  biogasLiters: 3, referenceId: donations[8]._id },
      { eventType: 'order_completed',    quantityKg: 1.5, co2PreventedKg: 1.5, mealsSaved: 0 },
      { eventType: 'order_completed',    quantityKg: 0.9, co2PreventedKg: 0.9, mealsSaved: 0 },
    ]);

    return res.status(200).json({
      success: true,
      message: '✅ PlatePulse production DB seeded successfully!',
      summary: {
        users: 14, donations: 12, missions: 5,
        products: 11, orders: 3, communityShares: 5,
        wasteRequests: 3, impactLogs: 7,
      },
      testAccounts: {
        password: 'Password@123',
        admin:      'admin@platepulse.in',
        donor:      'priya.donor@gmail.com',
        ngo:        'thomas.ngo@rotibank.org',
        volunteer:  'aakash.vol@gmail.com',
        retail:     'suresh.retail@morehyd.com',
        consumer:   'vikram.consumer@gmail.com',
        wastePlant: 'ramesh.waste@ghmc.gov.in',
      },
    });
  } catch (err) {
    console.error('Seed error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { runSeed };
