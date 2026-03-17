/**
 * PlatePulse - Full Seed Script
 * Covers all 6 roles + all data scenarios:
 *   - Users (donor, ngo, volunteer, retail, consumer, waste_plant, admin)
 *   - Donations (available / matched / in_transit / delivered / expired / wasted)
 *   - Missions (pending / accepted / in_transit / delivered)
 *   - Products (various expiry windows → auto discount tiers)
 *   - Orders (paid)
 *   - Community Shares (active, partially claimed, fully claimed)
 *   - Waste Requests (pending / confirmed / completed)
 *   - Impact Logs (donation_delivered, waste_processed, order_completed)
 *
 * Run: node src/seed.js
 * Requires MONGO_URI in .env
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User          = require('./models/User');
const Donation      = require('./models/Donation');
const Mission       = require('./models/Mission');
const Product       = require('./models/Product');
const Order         = require('./models/Order');
const CommunityShare = require('./models/CommunityShare');
const WasteRequest  = require('./models/WasteRequest');
const ImpactLog     = require('./models/ImpactLog');

// ─── Kochi area coordinates (lng, lat) ───────────────────────────────────────
const LOCATIONS = {
  ernakulam:   { coordinates: [76.2673, 9.9816],  address: 'MG Road, Ernakulam, Kochi, Kerala' },
  fort_kochi:  { coordinates: [76.2144, 9.9639],  address: 'Beach Road, Fort Kochi, Kerala' },
  kakkanad:    { coordinates: [76.3408, 10.0160], address: 'Infopark Road, Kakkanad, Kochi, Kerala' },
  aluva:       { coordinates: [76.3502, 10.1004], address: 'Market Road, Aluva, Ernakulam, Kerala' },
  thrippunithura: { coordinates: [76.3510, 9.9370], address: 'Hill Palace Road, Tripunithura, Kerala' },
  edapally:    { coordinates: [76.3012, 10.0200], address: 'Edapally Junction, NH 66, Kochi, Kerala' },
  vyttila:     { coordinates: [76.3104, 9.9617],  address: 'Vyttila Hub, NH 66, Kochi, Kerala' },
  palarivattom:{ coordinates: [76.3022, 10.0042], address: 'Palarivattom Junction, Kochi, Kerala' },
};

const hash = (pw) => bcrypt.hash(pw, 12);

const now    = new Date();
const hrs    = (n) => new Date(now.getTime() + n * 3600000);
const mins   = (n) => new Date(now.getTime() + n * 60000);
const daysAgo= (n) => new Date(now.getTime() - n * 86400000);

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // ── WIPE ──────────────────────────────────────────────────────────────────
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
  console.log('🗑️   Cleared existing data');

  // ─────────────────────────────────────────────────────────────────────────
  // 1. USERS
  // ─────────────────────────────────────────────────────────────────────────
  const pw = await hash('Password@123');

  const [admin, donor1, donor2, donor3, ngo1, ngo2, vol1, vol2, vol3,
         retail1, retail2, consumer1, consumer2, wastePlant1] =
    await User.insertMany([
      // ── Admin ──
      {
        name: 'Arjun Nair',
        email: 'admin@platepulse.in',
        password: pw,
        role: 'admin',
        phone: '9876543210',
        orgName: 'PlatePulse HQ',
        location: { ...LOCATIONS.ernakulam },
        isVerified: true,
        trustScore: 100,
        points: 9999,
        badge: 'hero',
      },

      // ── Donors ──
      {
        name: 'Priya Menon',
        email: 'priya.donor@gmail.com',
        password: pw,
        role: 'donor',
        phone: '9876500001',
        orgName: 'Grand Hyatt Kochi',
        location: { ...LOCATIONS.ernakulam },
        isVerified: true,
        trustScore: 88,
        points: 750,
        badge: 'gold',
      },
      {
        name: 'Rahul Krishnan',
        email: 'rahul.donor@gmail.com',
        password: pw,
        role: 'donor',
        phone: '9876500002',
        orgName: 'Rahul Wedding Catering',
        location: { ...LOCATIONS.fort_kochi },
        isVerified: true,
        trustScore: 75,
        points: 320,
        badge: 'silver',
      },
      {
        name: 'Deepa Thomas',
        email: 'deepa.donor@gmail.com',
        password: pw,
        role: 'donor',
        phone: '9876500003',
        orgName: 'Deepa Home Kitchen',
        location: { ...LOCATIONS.kakkanad },
        isVerified: true,
        trustScore: 65,
        points: 80,
        badge: 'bronze',
      },

      // ── NGOs ──
      {
        name: 'Sr. Anitha Joseph',
        email: 'anitha.ngo@snehaspandan.org',
        password: pw,
        role: 'ngo',
        phone: '9876500004',
        orgName: 'Sneha Spandan Charitable Trust',
        location: { ...LOCATIONS.fort_kochi },
        isVerified: true,
        trustScore: 95,
        points: 1200,
        badge: 'hero',
      },
      {
        name: 'Biju Paul',
        email: 'biju.ngo@annpurna.org',
        password: pw,
        role: 'ngo',
        phone: '9876500005',
        orgName: 'Annpurna Foundation Kochi',
        location: { ...LOCATIONS.edapally },
        isVerified: true,
        trustScore: 89,
        points: 540,
        badge: 'gold',
      },

      // ── Volunteers ──
      {
        name: 'Akshay Rajan',
        email: 'akshay.vol@gmail.com',
        password: pw,
        role: 'volunteer',
        phone: '9876500006',
        location: { ...LOCATIONS.ernakulam },
        isVerified: true,
        trustScore: 82,
        points: 610,
        badge: 'gold',
        isAvailable: true,
      },
      {
        name: 'Sneha Varghese',
        email: 'sneha.vol@gmail.com',
        password: pw,
        role: 'volunteer',
        phone: '9876500007',
        location: { ...LOCATIONS.vyttila },
        isVerified: true,
        trustScore: 70,
        points: 210,
        badge: 'silver',
        isAvailable: true,
      },
      {
        name: 'Midhun George',
        email: 'midhun.vol@gmail.com',
        password: pw,
        role: 'volunteer',
        phone: '9876500008',
        location: { ...LOCATIONS.kakkanad },
        isVerified: true,
        trustScore: 60,
        points: 55,
        badge: 'bronze',
        isAvailable: false, // currently busy
      },

      // ── Retailers ──
      {
        name: 'Sajith Kumar',
        email: 'sajith.retail@freshmart.com',
        password: pw,
        role: 'retail',
        phone: '9876500009',
        orgName: 'FreshMart Superstore Kochi',
        location: { ...LOCATIONS.palarivattom },
        isVerified: true,
        trustScore: 91,
        points: 0,
      },
      {
        name: 'Latha Pillai',
        email: 'latha.retail@naturals.com',
        password: pw,
        role: 'retail',
        phone: '9876500010',
        orgName: 'Naturals Organic Store',
        location: { ...LOCATIONS.thrippunithura },
        isVerified: true,
        trustScore: 84,
        points: 0,
      },

      // ── Consumers ──
      {
        name: 'Vivek Suresh',
        email: 'vivek.consumer@gmail.com',
        password: pw,
        role: 'consumer',
        phone: '9876500011',
        location: { ...LOCATIONS.palarivattom },
        isVerified: true,
        trustScore: 70,
        points: 0,
      },
      {
        name: 'Meera Das',
        email: 'meera.consumer@gmail.com',
        password: pw,
        role: 'consumer',
        phone: '9876500012',
        location: { ...LOCATIONS.edapally },
        isVerified: true,
        trustScore: 70,
        points: 0,
      },

      // ── Waste Plant ──
      {
        name: 'Sreejith Pillai',
        email: 'sreejith.waste@greenkochi.gov.in',
        password: pw,
        role: 'waste_plant',
        phone: '9876500013',
        orgName: 'Green Kochi Waste Management Plant',
        location: { ...LOCATIONS.aluva },
        isVerified: true,
        trustScore: 90,
        points: 0,
      },
    ]);

  console.log('👥  Users seeded (14 users across all roles)');

  // ─────────────────────────────────────────────────────────────────────────
  // 2. DONATIONS
  // ─────────────────────────────────────────────────────────────────────────
  const donations = await Donation.insertMany([
    // ── Scenario A: Available — fresh, plenty of time ──
    {
      donor: donor1._id,
      name: 'Biriyani & Raita (Wedding Banquet Surplus)',
      category: 'cooked',
      quantity: 80,
      quantityUnit: 'portions',
      image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400',
      aiValidated: true,
      aiConfidence: 94,
      preparedAt: new Date(now.getTime() - 1 * 3600000),
      expiresAt: hrs(22),
      pickupLocation: { ...LOCATIONS.ernakulam, type: 'Point' },
      status: 'available',
      specialInstructions: 'Please bring containers. Food is hot and sealed.',
    },
    // ── Scenario B: Available — urgent (<6h) ──
    {
      donor: donor2._id,
      name: 'White Bread Loaves (Day-old)',
      category: 'bakery',
      quantity: 30,
      quantityUnit: 'boxes',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
      aiValidated: true,
      aiConfidence: 88,
      preparedAt: daysAgo(1),
      expiresAt: hrs(4),
      pickupLocation: { ...LOCATIONS.fort_kochi, type: 'Point' },
      status: 'available',
      specialInstructions: 'Box the bread carefully. Available from 6 AM onwards.',
    },
    // ── Scenario C: Available — warning zone (<24h) ──
    {
      donor: donor1._id,
      name: 'Paneer Butter Masala + Rotis',
      category: 'cooked',
      quantity: 40,
      quantityUnit: 'portions',
      image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400',
      aiValidated: true,
      aiConfidence: 91,
      preparedAt: new Date(now.getTime() - 5 * 3600000),
      expiresAt: hrs(18),
      pickupLocation: { ...LOCATIONS.ernakulam, type: 'Point' },
      status: 'available',
    },
    // ── Scenario D: Available — raw produce ──
    {
      donor: donor3._id,
      name: 'Mixed Vegetables (Carrot, Beans, Beetroot)',
      category: 'raw',
      quantity: 12,
      quantityUnit: 'kg',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
      aiValidated: true,
      aiConfidence: 96,
      expiresAt: hrs(48),
      pickupLocation: { ...LOCATIONS.kakkanad, type: 'Point' },
      status: 'available',
      specialInstructions: 'Washed and sorted. Pickup from basement parking.',
    },
    // ── Scenario E: Matched (NGO accepted, waiting for volunteer) ──
    {
      donor: donor2._id,
      name: 'Fish Curry & Steamed Rice',
      category: 'cooked',
      quantity: 50,
      quantityUnit: 'portions',
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
      aiValidated: true,
      aiConfidence: 85,
      preparedAt: new Date(now.getTime() - 2 * 3600000),
      expiresAt: hrs(10),
      pickupLocation: { ...LOCATIONS.fort_kochi, type: 'Point' },
      status: 'matched',
      assignedTo: ngo1._id,
    },
    // ── Scenario F: In Transit ──
    {
      donor: donor1._id,
      name: 'Kerala Sadya (Onam Celebration Surplus)',
      category: 'cooked',
      quantity: 120,
      quantityUnit: 'portions',
      image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400',
      aiValidated: true,
      aiConfidence: 97,
      preparedAt: new Date(now.getTime() - 3 * 3600000),
      expiresAt: hrs(8),
      pickupLocation: { ...LOCATIONS.ernakulam, type: 'Point' },
      status: 'in_transit',
      assignedTo: vol1._id,
      pickupConfirmedAt: new Date(now.getTime() - 30 * 60000),
    },
    // ── Scenario G: Delivered (completed) ──
    {
      donor: donor1._id,
      name: 'Vegetable Stew & Appam',
      category: 'cooked',
      quantity: 60,
      quantityUnit: 'portions',
      aiValidated: true,
      aiConfidence: 90,
      preparedAt: daysAgo(1),
      expiresAt: new Date(daysAgo(1).getTime() + 8 * 3600000),
      pickupLocation: { ...LOCATIONS.ernakulam, type: 'Point' },
      status: 'delivered',
      assignedTo: vol1._id,
      pickupConfirmedAt: daysAgo(1),
      deliveryConfirmedAt: new Date(daysAgo(1).getTime() + 2 * 3600000),
      ngoRating: 5,
    },
    // ── Scenario H: Delivered (different volunteer) ──
    {
      donor: donor2._id,
      name: 'Palak Paneer & Chapati',
      category: 'cooked',
      quantity: 35,
      quantityUnit: 'portions',
      aiValidated: true,
      aiConfidence: 89,
      preparedAt: daysAgo(2),
      expiresAt: new Date(daysAgo(2).getTime() + 10 * 3600000),
      pickupLocation: { ...LOCATIONS.fort_kochi, type: 'Point' },
      status: 'delivered',
      assignedTo: vol2._id,
      pickupConfirmedAt: daysAgo(2),
      deliveryConfirmedAt: new Date(daysAgo(2).getTime() + 1.5 * 3600000),
      ngoRating: 4,
    },
    // ── Scenario I: Expired (nobody picked it up in time) ──
    {
      donor: donor3._id,
      name: 'Dal Tadka & Rice (Office Canteen)',
      category: 'cooked',
      quantity: 20,
      quantityUnit: 'portions',
      aiValidated: false,
      aiConfidence: 55,
      preparedAt: daysAgo(2),
      expiresAt: daysAgo(1),
      pickupLocation: { ...LOCATIONS.kakkanad, type: 'Point' },
      status: 'expired',
    },
    // ── Scenario J: Wasted (routed to waste plant) ──
    {
      donor: donor1._id,
      name: 'Mutton Biryani (Bulk — past safe window)',
      category: 'cooked',
      quantity: 45,
      quantityUnit: 'portions',
      aiValidated: true,
      aiConfidence: 42,
      preparedAt: daysAgo(3),
      expiresAt: daysAgo(2),
      pickupLocation: { ...LOCATIONS.ernakulam, type: 'Point' },
      status: 'wasted',
    },
    // ── Scenario K: Packaged goods (long expiry) ──
    {
      donor: donor2._id,
      name: 'Sealed Biscuit Packets (Diwali Gift Surplus)',
      category: 'packaged',
      quantity: 8,
      quantityUnit: 'boxes',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
      aiValidated: true,
      aiConfidence: 99,
      expiresAt: hrs(72),
      pickupLocation: { ...LOCATIONS.fort_kochi, type: 'Point' },
      status: 'available',
      specialInstructions: 'Sealed boxes — 48 packets per box.',
    },
    // ── Scenario L: Dairy ──
    {
      donor: donor1._id,
      name: 'Fresh Paneer (Bulk Hotel Surplus)',
      category: 'dairy',
      quantity: 5,
      quantityUnit: 'kg',
      aiValidated: true,
      aiConfidence: 93,
      expiresAt: hrs(36),
      pickupLocation: { ...LOCATIONS.ernakulam, type: 'Point' },
      status: 'available',
      specialInstructions: 'Keep refrigerated. Pickup before 10 AM.',
    },
  ]);

  console.log('🍽️   Donations seeded (12 donations across all statuses)');

  // ─────────────────────────────────────────────────────────────────────────
  // 3. MISSIONS
  // ─────────────────────────────────────────────────────────────────────────
  await Mission.insertMany([
    // Pending — NGO accepted, no volunteer yet
    {
      donation: donations[4]._id, // Fish Curry (matched)
      ngoId: ngo1._id,
      pickupAddress: LOCATIONS.fort_kochi.address,
      pickupLat: LOCATIONS.fort_kochi.coordinates[1],
      pickupLng: LOCATIONS.fort_kochi.coordinates[0],
      deliveryAddress: 'Sneha Spandan Shelter, Fort Kochi',
      deliveryLat: 9.9580,
      deliveryLng: 76.2100,
      status: 'pending',
      pointsReward: 50,
      acceptedAt: new Date(now.getTime() - 20 * 60000),
      qrToken: 'SEED_QR_TOKEN_MISSION_1',
    },
    // In transit — volunteer on the way
    {
      donation: donations[5]._id, // Kerala Sadya (in_transit)
      ngoId: ngo1._id,
      volunteerId: vol1._id,
      pickupAddress: LOCATIONS.ernakulam.address,
      pickupLat: LOCATIONS.ernakulam.coordinates[1],
      pickupLng: LOCATIONS.ernakulam.coordinates[0],
      deliveryAddress: 'Sneha Spandan Shelter, Fort Kochi',
      deliveryLat: 9.9580,
      deliveryLng: 76.2100,
      status: 'in_transit',
      pointsReward: 50,
      acceptedAt: new Date(now.getTime() - 45 * 60000),
      qrToken: 'SEED_QR_TOKEN_MISSION_2',
    },
    // Delivered — yesterday
    {
      donation: donations[6]._id, // Vegetable Stew
      ngoId: ngo1._id,
      volunteerId: vol1._id,
      pickupAddress: LOCATIONS.ernakulam.address,
      pickupLat: LOCATIONS.ernakulam.coordinates[1],
      pickupLng: LOCATIONS.ernakulam.coordinates[0],
      deliveryAddress: 'Sneha Spandan Shelter, Fort Kochi',
      deliveryLat: 9.9580,
      deliveryLng: 76.2100,
      status: 'delivered',
      pointsReward: 50,
      acceptedAt: daysAgo(1),
      qrToken: 'SEED_QR_TOKEN_MISSION_3',
    },
    // Delivered — 2 days ago (different volunteer)
    {
      donation: donations[7]._id, // Palak Paneer
      ngoId: ngo2._id,
      volunteerId: vol2._id,
      pickupAddress: LOCATIONS.fort_kochi.address,
      pickupLat: LOCATIONS.fort_kochi.coordinates[1],
      pickupLng: LOCATIONS.fort_kochi.coordinates[0],
      deliveryAddress: 'Annpurna Foundation, Edapally',
      deliveryLat: LOCATIONS.edapally.coordinates[1],
      deliveryLng: LOCATIONS.edapally.coordinates[0],
      status: 'delivered',
      pointsReward: 50,
      acceptedAt: daysAgo(2),
      qrToken: 'SEED_QR_TOKEN_MISSION_4',
    },
    // Expired mission (donation expired before pickup)
    {
      donation: donations[8]._id, // Dal Tadka expired
      ngoId: ngo2._id,
      pickupAddress: LOCATIONS.kakkanad.address,
      pickupLat: LOCATIONS.kakkanad.coordinates[1],
      pickupLng: LOCATIONS.kakkanad.coordinates[0],
      deliveryAddress: 'Annpurna Foundation, Edapally',
      deliveryLat: LOCATIONS.edapally.coordinates[1],
      deliveryLng: LOCATIONS.edapally.coordinates[0],
      status: 'expired',
      pointsReward: 50,
      acceptedAt: daysAgo(2),
      qrToken: 'SEED_QR_TOKEN_MISSION_5',
    },
  ]);

  console.log('🚴  Missions seeded (5 missions)');

  // ─────────────────────────────────────────────────────────────────────────
  // 4. PRODUCTS (Retail Marketplace)
  // ─────────────────────────────────────────────────────────────────────────
  // Discount tiers:
  //   >= 7 days  → 0%
  //   < 7 days   → 20%
  //   < 4 days   → 40%
  //   < 2 days   → 70%
  //   < 1 day    → 80%

  const calcDiscount = (expiresAt) => {
    const hrsLeft = (expiresAt - now) / 3600000;
    if (hrsLeft < 24)  return { pct: 80 };
    if (hrsLeft < 48)  return { pct: 70 };
    if (hrsLeft < 96)  return { pct: 40 };
    if (hrsLeft < 168) return { pct: 20 };
    return { pct: 0 };
  };

  const makeProduct = (retailer, name, category, mrp, qty, expiresAt, loc, active = true) => {
    const { pct } = calcDiscount(expiresAt);
    return {
      retailer: retailer._id,
      name,
      category,
      mrp,
      finalPrice: Math.round(mrp * (1 - pct / 100)),
      discountPercent: pct,
      quantity: qty,
      expiresAt,
      storeLocation: { ...loc, type: 'Point' },
      isActive: active,
      urgentBadge: (expiresAt - now) / 3600000 < 24,
    };
  };

  const products = await Product.insertMany([
    // 80% off — expires in <24h
    makeProduct(retail1, 'Amul Full Cream Milk (500ml)', 'dairy',    28,  40, hrs(10),  LOCATIONS.palarivattom),
    makeProduct(retail1, 'Mother Dairy Paneer (200g)',   'dairy',    65,  15, hrs(18),  LOCATIONS.palarivattom),
    // 70% off — expires in 24–48h
    makeProduct(retail1, 'Britannia Bread (400g)',       'bakery',   45,  60, hrs(36),  LOCATIONS.palarivattom),
    makeProduct(retail2, 'Harvest Gold Multigrain Bread','bakery',   55,  25, hrs(42),  LOCATIONS.thrippunithura),
    // 40% off — expires in 48–96h
    makeProduct(retail1, 'Nestle Yogurt Strawberry (80g)','dairy',   22,  80, hrs(72),  LOCATIONS.palarivattom),
    makeProduct(retail2, 'Organic Spinach Bunch',        'produce',  30,  30, hrs(60),  LOCATIONS.thrippunithura),
    makeProduct(retail2, 'Cherry Tomatoes (250g punnet)', 'produce', 45,  20, hrs(80),  LOCATIONS.thrippunithura),
    // 20% off — expires in 4–7 days
    makeProduct(retail1, 'Aashirvaad Atta (1kg)',        'grocery', 58,  50, hrs(120), LOCATIONS.palarivattom),
    makeProduct(retail2, 'Tata Salt (1kg)',              'grocery',  22, 100, hrs(144), LOCATIONS.thrippunithura),
    // No discount — far from expiry (but still listed)
    makeProduct(retail1, 'Real Fruit Juice Mango (1L)',  'beverage', 85,  35, hrs(300), LOCATIONS.palarivattom, false),
    // Out of stock / sold through
    makeProduct(retail2, 'Amul Butter (100g)',           'dairy',    55,   0, hrs(50),  LOCATIONS.thrippunithura),
  ]);

  console.log('🏪  Products seeded (11 products across all discount tiers)');

  // ─────────────────────────────────────────────────────────────────────────
  // 5. ORDERS (Consumer purchases)
  // ─────────────────────────────────────────────────────────────────────────
  await Order.insertMany([
    // Vivek bought milk + bread
    {
      consumer: consumer1._id,
      items: [
        { product: products[0]._id, quantity: 4, price: products[0].finalPrice },
        { product: products[2]._id, quantity: 2, price: products[2].finalPrice },
      ],
      totalAmount: products[0].finalPrice * 4 + products[2].finalPrice * 2,
      paymentStatus: 'paid',
      paymentId: 'pay_seed_test_001',
      razorpayOrderId: 'order_seed_test_001',
    },
    // Meera bought yogurt + tomatoes
    {
      consumer: consumer2._id,
      items: [
        { product: products[4]._id, quantity: 3, price: products[4].finalPrice },
        { product: products[6]._id, quantity: 2, price: products[6].finalPrice },
      ],
      totalAmount: products[4].finalPrice * 3 + products[6].finalPrice * 2,
      paymentStatus: 'paid',
      paymentId: 'pay_seed_test_002',
      razorpayOrderId: 'order_seed_test_002',
    },
    // Failed payment (abandoned checkout)
    {
      consumer: consumer1._id,
      items: [
        { product: products[1]._id, quantity: 1, price: products[1].finalPrice },
      ],
      totalAmount: products[1].finalPrice,
      paymentStatus: 'failed',
      razorpayOrderId: 'order_seed_test_003',
    },
  ]);

  console.log('🛒  Orders seeded (3 orders: 2 paid, 1 failed)');

  // ─────────────────────────────────────────────────────────────────────────
  // 6. COMMUNITY SHARES
  // ─────────────────────────────────────────────────────────────────────────
  await CommunityShare.insertMany([
    // Active — newly posted, nobody claimed yet
    {
      postedBy: consumer1._id,
      name: 'Homemade Kerala Banana Halwa',
      category: 'cooked',
      quantity: 6,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
      location: { ...LOCATIONS.palarivattom, type: 'Point' },
      claimedByLimit: 3,
      claimedCount: 0,
      expiresAt: hrs(12),
      isActive: true,
    },
    // Partially claimed (2 out of 4 taken)
    {
      postedBy: consumer2._id,
      name: 'Excess Avial & Rice from Family Feast',
      category: 'cooked',
      quantity: 8,
      image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400',
      location: { ...LOCATIONS.edapally, type: 'Point' },
      claimedByLimit: 4,
      claimedCount: 2,
      expiresAt: hrs(6),
      isActive: true,
    },
    // Fully claimed — no slots left
    {
      postedBy: consumer1._id,
      name: 'Fresh Mango from Our Tree (Alphonso)',
      category: 'produce',
      quantity: 12,
      image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
      location: { ...LOCATIONS.palarivattom, type: 'Point' },
      claimedByLimit: 3,
      claimedCount: 3,
      expiresAt: hrs(24),
      isActive: false, // fully claimed = inactive
    },
    // Expired community share
    {
      postedBy: consumer2._id,
      name: 'Leftover Payasam (Onam)',
      category: 'cooked',
      quantity: 4,
      location: { ...LOCATIONS.edapally, type: 'Point' },
      claimedByLimit: 2,
      claimedCount: 0,
      expiresAt: daysAgo(1),
      isActive: false,
    },
    // Active — raw produce
    {
      postedBy: donor3._id,
      name: 'Garden Fresh Curry Leaves & Coriander',
      category: 'produce',
      quantity: 3,
      location: { ...LOCATIONS.kakkanad, type: 'Point' },
      claimedByLimit: 3,
      claimedCount: 1,
      expiresAt: hrs(36),
      isActive: true,
    },
  ]);

  console.log('🤝  Community shares seeded (5 shares: active / partial / full / expired)');

  // ─────────────────────────────────────────────────────────────────────────
  // 7. WASTE REQUESTS
  // ─────────────────────────────────────────────────────────────────────────
  await WasteRequest.insertMany([
    // Pending — just assigned to waste plant
    {
      donation: donations[8]._id, // Dal Tadka expired
      wastePlant: wastePlant1._id,
      status: 'pending',
    },
    // Confirmed — plant acknowledged, processing not yet reported
    {
      donation: donations[9]._id, // Mutton Biryani wasted
      wastePlant: wastePlant1._id,
      status: 'confirmed',
      confirmedAt: new Date(now.getTime() - 3 * 3600000),
    },
    // Completed — plant filed the yield report
    {
      donation: donations[9]._id,
      wastePlant: wastePlant1._id,
      status: 'completed',
      compostKg: 18,
      biogasLiters: 6,
      feedKg: 3,
      confirmedAt: daysAgo(2),
    },
  ]);

  console.log('♻️   Waste requests seeded (pending / confirmed / completed)');

  // ─────────────────────────────────────────────────────────────────────────
  // 8. IMPACT LOGS
  // ─────────────────────────────────────────────────────────────────────────
  await ImpactLog.insertMany([
    // Delivered donation logs
    { eventType: 'donation_delivered', quantityKg: 24,  mealsSaved: 60, co2PreventedKg: 60,  referenceId: donations[6]._id },
    { eventType: 'donation_delivered', quantityKg: 14,  mealsSaved: 35, co2PreventedKg: 35,  referenceId: donations[7]._id },
    { eventType: 'donation_delivered', quantityKg: 48,  mealsSaved: 120,co2PreventedKg: 120, referenceId: donations[5]._id },
    // Waste processed logs
    { eventType: 'waste_processed',    quantityKg: 18,  co2PreventedKg: 9,  compostKg: 18, biogasLiters: 6,  referenceId: donations[9]._id },
    { eventType: 'waste_processed',    quantityKg: 8,   co2PreventedKg: 4,  compostKg: 6,  biogasLiters: 2,  referenceId: donations[8]._id },
    // Order completed logs (marketplace)
    { eventType: 'order_completed',    quantityKg: 1.2, co2PreventedKg: 1.2, mealsSaved: 0 },
    { eventType: 'order_completed',    quantityKg: 0.8, co2PreventedKg: 0.8, mealsSaved: 0 },
  ]);

  console.log('📊  Impact logs seeded (7 logs)');

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✅  PlatePulse seed complete!');
  console.log('═══════════════════════════════════════════');
  console.log('\n📋  TEST ACCOUNTS (all passwords: Password@123)');
  console.log('  admin@platepulse.in             → Admin');
  console.log('  priya.donor@gmail.com           → Donor (Grand Hyatt Kochi)');
  console.log('  rahul.donor@gmail.com           → Donor (Wedding Catering)');
  console.log('  deepa.donor@gmail.com           → Donor (Home Kitchen)');
  console.log('  anitha.ngo@snehaspandan.org     → NGO (Sneha Spandan)');
  console.log('  biju.ngo@annpurna.org           → NGO (Annpurna Foundation)');
  console.log('  akshay.vol@gmail.com            → Volunteer (Gold badge)');
  console.log('  sneha.vol@gmail.com             → Volunteer (Silver badge)');
  console.log('  midhun.vol@gmail.com            → Volunteer (unavailable)');
  console.log('  sajith.retail@freshmart.com     → Retailer (FreshMart)');
  console.log('  latha.retail@naturals.com       → Retailer (Naturals Organic)');
  console.log('  vivek.consumer@gmail.com        → Consumer');
  console.log('  meera.consumer@gmail.com        → Consumer');
  console.log('  sreejith.waste@greenkochi.gov.in→ Waste Plant');
  console.log('═══════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
