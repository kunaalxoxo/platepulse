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

const L = {
  banjara:  { coordinates: [78.4483, 17.4126], address: 'Road No. 12, Banjara Hills, Hyderabad' },
  jubilee:  { coordinates: [78.4068, 17.4321], address: 'Film Nagar Road, Jubilee Hills, Hyderabad' },
  hitech:   { coordinates: [78.3816, 17.4498], address: 'Cyber Towers, HITEC City, Hyderabad' },
  sec:      { coordinates: [78.4983, 17.4399], address: 'MG Road, Secunderabad, Hyderabad' },
  old:      { coordinates: [78.4740, 17.3616], address: 'Charminar Road, Old City, Hyderabad' },
  gachi:    { coordinates: [78.3428, 17.4401], address: 'DLF Cyber City, Gachibowli, Hyderabad' },
  kompally: { coordinates: [78.4863, 17.5410], address: 'Kompally Main Road, Medchal, Hyderabad' },
  lbnagar:  { coordinates: [78.5535, 17.3490], address: 'LB Nagar Circle, Hyderabad' },
};

// Stable, publicly-cacheable food images via Unsplash source API (no auth needed)
const IMG = {
  biryani:   'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&auto=format',
  bread:     'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format',
  paneer:    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format',
  veggies:   'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format',
  biscuits:  'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format',
  dairy:     'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format',
  haleem:    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&auto=format',
  curry:     'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&auto=format',
  pulao:     'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&auto=format',
  dal:       'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format',
  milk:      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format',
  butter:    'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format',
  yogurt:    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format',
  tomatoes:  'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&auto=format',
  atta:      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format',
  juice:     'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&auto=format',
  meetha:    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format',
  khichdi:   'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&auto=format',
  mangoes:   'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&auto=format',
};

const pt  = (loc) => ({ type: 'Point', ...loc });
// days() sets expiry N days from now — safe for demo
const days = (n) => new Date(Date.now() + n * 86400000);
const hrs  = (n) => new Date(Date.now() + n * 3600000);
const ago  = (n) => new Date(Date.now() - n * 86400000);

exports.runSeed = async (req, res) => {
  if (req.query.key !== SEED_KEY)
    return res.status(403).json({ success: false, message: 'Invalid seed key' });

  try {
    await Promise.all([
      User.deleteMany({}), Donation.deleteMany({}), Mission.deleteMany({}),
      Product.deleteMany({}), Order.deleteMany({}), CommunityShare.deleteMany({}),
      WasteRequest.deleteMany({}), ImpactLog.deleteMany({}),
    ]);

    const pw = await bcrypt.hash('Password@123', 12);

    // ── USERS ────────────────────────────────────────────────────────────────
    const [
      , donor1, donor2, donor3, ngo1, ngo2,
      vol1, vol2, , retail1, retail2, consumer1, consumer2, wastePlant1,
    ] = await User.insertMany([
      { name: 'Karthik Reddy',        email: 'admin@platepulse.in',           password: pw, role: 'admin',       phone: '9876543210', orgName: 'PlatePulse HQ',                         location: pt(L.hitech),   isVerified: true, trustScore: 100, points: 9999, badge: 'hero' },
      { name: 'Priya Sharma',         email: 'priya.donor@gmail.com',          password: pw, role: 'donor',       phone: '9876500001', orgName: 'Taj Falaknuma Palace Banquets',          location: pt(L.banjara),  isVerified: true, trustScore: 88,  points: 750,  badge: 'gold' },
      { name: 'Rahul Gupta',          email: 'rahul.donor@gmail.com',          password: pw, role: 'donor',       phone: '9876500002', orgName: 'Rahul Wedding & Events Catering',       location: pt(L.jubilee),  isVerified: true, trustScore: 75,  points: 320,  badge: 'silver' },
      { name: 'Deepika Rao',          email: 'deepika.donor@gmail.com',        password: pw, role: 'donor',       phone: '9876500003', orgName: 'Deepika Home Kitchen',                  location: pt(L.gachi),    isVerified: true, trustScore: 65,  points: 80,   badge: 'bronze' },
      { name: "Father Thomas D'Cruz", email: 'thomas.ngo@rotibank.org',        password: pw, role: 'ngo',         phone: '9876500004', orgName: 'Roti Bank Hyderabad',                   location: pt(L.sec),      isVerified: true, trustScore: 95,  points: 1200, badge: 'hero' },
      { name: 'Sameena Begum',        email: 'sameena.ngo@feedhyd.org',        password: pw, role: 'ngo',         phone: '9876500005', orgName: 'Feed Hyderabad Foundation',             location: pt(L.old),      isVerified: true, trustScore: 89,  points: 540,  badge: 'gold' },
      { name: 'Aakash Verma',         email: 'aakash.vol@gmail.com',           password: pw, role: 'volunteer',   phone: '9876500006',                                                   location: pt(L.banjara),  isVerified: true, trustScore: 82,  points: 610,  badge: 'gold',   isAvailable: true },
      { name: 'Sneha Kulkarni',       email: 'sneha.vol@gmail.com',            password: pw, role: 'volunteer',   phone: '9876500007',                                                   location: pt(L.lbnagar),  isVerified: true, trustScore: 70,  points: 210,  badge: 'silver', isAvailable: true },
      { name: 'Naveen Chandra',       email: 'naveen.vol@gmail.com',           password: pw, role: 'volunteer',   phone: '9876500008',                                                   location: pt(L.gachi),    isVerified: true, trustScore: 60,  points: 55,   badge: 'bronze', isAvailable: false },
      { name: 'Suresh Agarwal',       email: 'suresh.retail@morehyd.com',      password: pw, role: 'retail',      phone: '9876500009', orgName: 'More Supermarket - Banjara Hills',       location: pt(L.banjara),  isVerified: true, trustScore: 91,  points: 0 },
      { name: 'Lakshmi Naidu',        email: 'lakshmi.retail@organic-hyd.com', password: pw, role: 'retail',      phone: '9876500010', orgName: "Nature's Basket Organic - Gachibowli",  location: pt(L.gachi),    isVerified: true, trustScore: 84,  points: 0 },
      { name: 'Vikram Mehta',         email: 'vikram.consumer@gmail.com',      password: pw, role: 'consumer',    phone: '9876500011',                                                   location: pt(L.hitech),   isVerified: true, trustScore: 70,  points: 0 },
      { name: 'Meghana Iyer',         email: 'meghana.consumer@gmail.com',     password: pw, role: 'consumer',    phone: '9876500012',                                                   location: pt(L.jubilee),  isVerified: true, trustScore: 70,  points: 0 },
      { name: 'Ramesh Babu',          email: 'ramesh.waste@ghmc.gov.in',       password: pw, role: 'waste_plant', phone: '9876500013', orgName: 'GHMC Bio-Compost Plant - Jawaharnagar', location: pt(L.kompally), isVerified: true, trustScore: 90,  points: 0 },
    ]);

    // ── DONATIONS (expiry = 7+ days so they never auto-expire during demo) ───────
    const donations = await Donation.insertMany([
      { donor: donor1._id, name: 'Hyderabadi Dum Biryani & Mirchi Ka Salan', category: 'cooked',   quantity: 100, quantityUnit: 'portions', image: IMG.biryani, aiValidated: true,  aiConfidence: 95, preparedAt: new Date(Date.now()-3600000),   expiresAt: days(7),  pickupLocation: pt(L.banjara), status: 'available' },
      { donor: donor2._id, name: 'Osmania Biscuits & Irani Chai Snacks',     category: 'bakery',   quantity: 20,  quantityUnit: 'boxes',    image: IMG.biscuits,aiValidated: true,  aiConfidence: 87, preparedAt: ago(1),                         expiresAt: days(7),  pickupLocation: pt(L.jubilee), status: 'available' },
      { donor: donor1._id, name: 'Paneer Tikka Masala + Butter Naan',        category: 'cooked',   quantity: 45,  quantityUnit: 'portions', image: IMG.paneer,  aiValidated: true,  aiConfidence: 92, preparedAt: new Date(Date.now()-18000000),  expiresAt: days(7),  pickupLocation: pt(L.banjara), status: 'available' },
      { donor: donor3._id, name: 'Mixed Vegetables - Tomatoes, Capsicum',    category: 'raw',      quantity: 15,  quantityUnit: 'kg',       image: IMG.veggies, aiValidated: true,  aiConfidence: 97,                                            expiresAt: days(7),  pickupLocation: pt(L.gachi),   status: 'available' },
      { donor: donor2._id, name: 'Parle-G & Good Day Biscuit Packets',       category: 'packaged', quantity: 10,  quantityUnit: 'boxes',    image: IMG.biscuits,aiValidated: true,  aiConfidence: 99,                                            expiresAt: days(30), pickupLocation: pt(L.jubilee), status: 'available' },
      { donor: donor1._id, name: 'Fresh Paneer & Dahi (Hotel Surplus)',       category: 'dairy',    quantity: 6,   quantityUnit: 'kg',       image: IMG.dairy,   aiValidated: true,  aiConfidence: 94,                                            expiresAt: days(7),  pickupLocation: pt(L.banjara), status: 'available' },
      { donor: donor2._id, name: 'Mutton Haleem & Sheermal',                  category: 'cooked',   quantity: 60,  quantityUnit: 'portions', image: IMG.haleem,  aiValidated: true,  aiConfidence: 86, preparedAt: new Date(Date.now()-7200000),   expiresAt: days(7),  pickupLocation: pt(L.jubilee), status: 'matched',   assignedTo: ngo1._id },
      { donor: donor1._id, name: 'Bagara Baingan + Jowar Roti',              category: 'cooked',   quantity: 80,  quantityUnit: 'portions', image: IMG.curry,   aiValidated: true,  aiConfidence: 93, preparedAt: new Date(Date.now()-10800000),  expiresAt: days(7),  pickupLocation: pt(L.hitech),  status: 'in_transit', assignedTo: vol1._id, pickupConfirmedAt: new Date(Date.now()-1800000) },
      { donor: donor1._id, name: 'Vegetable Pulao & Raita',                  category: 'cooked',   quantity: 70,  quantityUnit: 'portions', image: IMG.pulao,   aiValidated: true,  aiConfidence: 91, preparedAt: ago(1),                         expiresAt: new Date(ago(1).getTime()+28800000), pickupLocation: pt(L.banjara), status: 'delivered', assignedTo: vol1._id, pickupConfirmedAt: ago(1), deliveryConfirmedAt: new Date(ago(1).getTime()+7200000), ngoRating: 5 },
      { donor: donor2._id, name: 'Dal Makhani & Tandoori Roti',              category: 'cooked',   quantity: 40,  quantityUnit: 'portions', image: IMG.dal,     aiValidated: true,  aiConfidence: 89, preparedAt: ago(2),                         expiresAt: new Date(ago(2).getTime()+36000000), pickupLocation: pt(L.jubilee), status: 'delivered', assignedTo: vol2._id, pickupConfirmedAt: ago(2), deliveryConfirmedAt: new Date(ago(2).getTime()+5400000), ngoRating: 4 },
      { donor: donor3._id, name: 'Sambar Rice & Papad',                      category: 'cooked',   quantity: 25,  quantityUnit: 'portions',               aiValidated: false, aiConfidence: 52, preparedAt: ago(2),                         expiresAt: ago(1),  pickupLocation: pt(L.gachi),   status: 'expired' },
      { donor: donor1._id, name: 'Chicken Biryani Bulk (Past Safe Window)',  category: 'cooked',   quantity: 50,  quantityUnit: 'portions',               aiValidated: true,  aiConfidence: 38, preparedAt: ago(3),                         expiresAt: ago(2),  pickupLocation: pt(L.banjara), status: 'wasted' },
    ]);

    // ── MISSIONS ────────────────────────────────────────────────────────────
    await Mission.insertMany([
      { donation: donations[6]._id,  ngoId: ngo1._id,                        pickupAddress: L.jubilee.address, pickupLat: L.jubilee.coordinates[1], pickupLng: L.jubilee.coordinates[0], deliveryAddress: 'Roti Bank Shelter, Secunderabad', deliveryLat: L.sec.coordinates[1], deliveryLng: L.sec.coordinates[0], status: 'pending',    pointsReward: 50, acceptedAt: new Date(Date.now()-1200000), qrToken: 'QR_SEED_001' },
      { donation: donations[7]._id,  ngoId: ngo1._id, volunteerId: vol1._id, pickupAddress: L.hitech.address,  pickupLat: L.hitech.coordinates[1],  pickupLng: L.hitech.coordinates[0],  deliveryAddress: 'Roti Bank Shelter, Secunderabad', deliveryLat: L.sec.coordinates[1], deliveryLng: L.sec.coordinates[0], status: 'in_transit', pointsReward: 50, acceptedAt: new Date(Date.now()-2700000), qrToken: 'QR_SEED_002' },
      { donation: donations[8]._id,  ngoId: ngo1._id, volunteerId: vol1._id, pickupAddress: L.banjara.address, pickupLat: L.banjara.coordinates[1], pickupLng: L.banjara.coordinates[0], deliveryAddress: 'Roti Bank Shelter, Secunderabad', deliveryLat: L.sec.coordinates[1], deliveryLng: L.sec.coordinates[0], status: 'delivered',  pointsReward: 50, acceptedAt: ago(1),                       qrToken: 'QR_SEED_003' },
      { donation: donations[9]._id,  ngoId: ngo2._id, volunteerId: vol2._id, pickupAddress: L.jubilee.address, pickupLat: L.jubilee.coordinates[1], pickupLng: L.jubilee.coordinates[0], deliveryAddress: 'Feed Hyderabad Centre, Old City',  deliveryLat: L.old.coordinates[1], deliveryLng: L.old.coordinates[0], status: 'delivered',  pointsReward: 50, acceptedAt: ago(2),                       qrToken: 'QR_SEED_004' },
      { donation: donations[10]._id, ngoId: ngo2._id,                        pickupAddress: L.gachi.address,   pickupLat: L.gachi.coordinates[1],   pickupLng: L.gachi.coordinates[0],   deliveryAddress: 'Feed Hyderabad Centre, Old City',  deliveryLat: L.old.coordinates[1], deliveryLng: L.old.coordinates[0], status: 'expired',    pointsReward: 50, acceptedAt: ago(2),                       qrToken: 'QR_SEED_005' },
    ]);

    // ── PRODUCTS (expiry = 30 days, isActive always true, stable images) ──────
    const disc = (mrp, pct) => Math.round(mrp * (1 - pct / 100));
    const products = await Product.insertMany([
      { retailer: retail1._id, name: 'Amul Taaza Toned Milk 500ml',         category: 'dairy',    mrp: 28,  finalPrice: disc(28,50),  discountPercent: 50, quantity: 40,  image: IMG.milk,    expiresAt: days(30), storeLocation: pt(L.banjara), isActive: true, urgentBadge: false },
      { retailer: retail1._id, name: 'Mother Dairy Paneer Block 200g',      category: 'dairy',    mrp: 68,  finalPrice: disc(68,40),  discountPercent: 40, quantity: 12,  image: IMG.dairy,   expiresAt: days(30), storeLocation: pt(L.banjara), isActive: true, urgentBadge: false },
      { retailer: retail1._id, name: 'Britannia Whole Wheat Bread 400g',    category: 'bakery',   mrp: 48,  finalPrice: disc(48,40),  discountPercent: 40, quantity: 55,  image: IMG.bread,   expiresAt: days(30), storeLocation: pt(L.banjara), isActive: true, urgentBadge: false },
      { retailer: retail2._id, name: 'English Oven Multigrain Bread 500g',  category: 'bakery',   mrp: 58,  finalPrice: disc(58,40),  discountPercent: 40, quantity: 20,  image: IMG.bread,   expiresAt: days(30), storeLocation: pt(L.gachi),   isActive: true, urgentBadge: false },
      { retailer: retail1._id, name: 'Epigamia Greek Yogurt Mango 90g',     category: 'dairy',    mrp: 35,  finalPrice: disc(35,30),  discountPercent: 30, quantity: 70,  image: IMG.yogurt,  expiresAt: days(30), storeLocation: pt(L.banjara), isActive: true, urgentBadge: false },
      { retailer: retail2._id, name: 'Organic Fresh Methi Bunch',           category: 'produce',  mrp: 25,  finalPrice: disc(25,30),  discountPercent: 30, quantity: 30,  image: IMG.veggies, expiresAt: days(30), storeLocation: pt(L.gachi),   isActive: true, urgentBadge: false },
      { retailer: retail2._id, name: 'Cherry Tomatoes Punnet 250g',         category: 'produce',  mrp: 50,  finalPrice: disc(50,20),  discountPercent: 20, quantity: 18,  image: IMG.tomatoes,expiresAt: days(30), storeLocation: pt(L.gachi),   isActive: true, urgentBadge: false },
      { retailer: retail1._id, name: 'Aashirvaad Multigrain Atta 1kg',      category: 'grocery',  mrp: 62,  finalPrice: disc(62,20),  discountPercent: 20, quantity: 45,  image: IMG.atta,    expiresAt: days(30), storeLocation: pt(L.banjara), isActive: true, urgentBadge: false },
      { retailer: retail2._id, name: 'Tata Rock Salt 1kg',                  category: 'grocery',  mrp: 24,  finalPrice: disc(24,20),  discountPercent: 20, quantity: 100, image: IMG.atta,    expiresAt: days(30), storeLocation: pt(L.gachi),   isActive: true, urgentBadge: false },
      { retailer: retail1._id, name: 'Paper Boat Aam Panna Juice 250ml x4', category: 'beverage', mrp: 80,  finalPrice: disc(80,20),  discountPercent: 20, quantity: 30,  image: IMG.juice,   expiresAt: days(30), storeLocation: pt(L.banjara), isActive: true, urgentBadge: false },
      { retailer: retail2._id, name: 'Amul Gold Butter 100g',               category: 'dairy',    mrp: 58,  finalPrice: disc(58,40),  discountPercent: 40, quantity: 15,  image: IMG.butter,  expiresAt: days(30), storeLocation: pt(L.gachi),   isActive: true, urgentBadge: false },
      { retailer: retail1._id, name: 'Nestle Dahi 400g Cup',                category: 'dairy',    mrp: 45,  finalPrice: disc(45,50),  discountPercent: 50, quantity: 25,  image: IMG.yogurt,  expiresAt: days(30), storeLocation: pt(L.banjara), isActive: true, urgentBadge: false },
    ]);

    // ── ORDERS ───────────────────────────────────────────────────────────────
    await Order.insertMany([
      { consumer: consumer1._id, items: [{ product: products[0]._id, quantity: 4, price: products[0].finalPrice }, { product: products[2]._id, quantity: 2, price: products[2].finalPrice }], totalAmount: products[0].finalPrice*4 + products[2].finalPrice*2, paymentStatus: 'paid',   paymentId: 'pay_seed_001', razorpayOrderId: 'order_seed_001' },
      { consumer: consumer2._id, items: [{ product: products[4]._id, quantity: 3, price: products[4].finalPrice }, { product: products[6]._id, quantity: 2, price: products[6].finalPrice }], totalAmount: products[4].finalPrice*3 + products[6].finalPrice*2, paymentStatus: 'paid',   paymentId: 'pay_seed_002', razorpayOrderId: 'order_seed_002' },
      { consumer: consumer1._id, items: [{ product: products[1]._id, quantity: 1, price: products[1].finalPrice }],                                                                             totalAmount: products[1].finalPrice,                                paymentStatus: 'failed',                             razorpayOrderId: 'order_seed_003' },
    ]);

    // ── COMMUNITY SHARES (expiry = 7 days so they stay visible) ───────────────
    await CommunityShare.insertMany([
      { postedBy: consumer1._id, name: 'Homemade Hyderabadi Double Ka Meetha',         category: 'cooked',  quantity: 8,  image: IMG.meetha,  location: pt(L.hitech),  claimedByLimit: 4, claimedCount: 0, expiresAt: days(7), isActive: true },
      { postedBy: consumer2._id, name: 'Extra Khichdi & Pickle from Home (Amma Made)', category: 'cooked',  quantity: 10, image: IMG.khichdi, location: pt(L.jubilee), claimedByLimit: 5, claimedCount: 2, expiresAt: days(7), isActive: true },
      { postedBy: donor3._id,    name: 'Garden-grown Curry Leaves & Green Chillies',   category: 'produce', quantity: 4,  image: IMG.veggies, location: pt(L.gachi),   claimedByLimit: 4, claimedCount: 1, expiresAt: days(7), isActive: true },
      { postedBy: consumer1._id, name: 'Fresh Banganapalli Mangoes from Our Farm',     category: 'produce', quantity: 15, image: IMG.mangoes, location: pt(L.hitech),  claimedByLimit: 3, claimedCount: 3, expiresAt: days(7), isActive: false },
    ]);

    // ── WASTE REQUESTS ───────────────────────────────────────────────────────
    await WasteRequest.insertMany([
      { donation: donations[10]._id, wastePlant: wastePlant1._id, status: 'pending' },
      { donation: donations[11]._id, wastePlant: wastePlant1._id, status: 'confirmed', confirmedAt: new Date(Date.now()-10800000) },
      { donation: donations[11]._id, wastePlant: wastePlant1._id, status: 'completed', compostKg: 20, biogasLiters: 8, feedKg: 4, confirmedAt: ago(2) },
    ]);

    // ── IMPACT LOGS ──────────────────────────────────────────────────────────
    await ImpactLog.insertMany([
      { eventType: 'donation_delivered', quantityKg: 28, mealsSaved: 70,  co2PreventedKg: 70,  referenceId: donations[8]._id,  createdAt: ago(1) },
      { eventType: 'donation_delivered', quantityKg: 16, mealsSaved: 40,  co2PreventedKg: 40,  referenceId: donations[9]._id,  createdAt: ago(2) },
      { eventType: 'donation_delivered', quantityKg: 32, mealsSaved: 80,  co2PreventedKg: 80,  referenceId: donations[7]._id,  createdAt: new Date(Date.now()-5400000) },
      { eventType: 'donation_delivered', quantityKg: 18, mealsSaved: 45,  co2PreventedKg: 45,  referenceId: donations[6]._id,  createdAt: ago(3) },
      { eventType: 'donation_delivered', quantityKg: 12, mealsSaved: 30,  co2PreventedKg: 30,  referenceId: donations[5]._id,  createdAt: ago(4) },
      { eventType: 'waste_processed',    quantityKg: 20, co2PreventedKg: 10, compostKg: 20, biogasLiters: 8, referenceId: donations[11]._id, createdAt: ago(2) },
      { eventType: 'waste_processed',    quantityKg: 10, co2PreventedKg: 5,  compostKg: 8,  biogasLiters: 3, referenceId: donations[10]._id, createdAt: ago(3) },
      { eventType: 'order_completed',    quantityKg: 1.5, co2PreventedKg: 1.5, mealsSaved: 0, createdAt: ago(1) },
      { eventType: 'order_completed',    quantityKg: 0.9, co2PreventedKg: 0.9, mealsSaved: 0, createdAt: ago(2) },
    ]);

    return res.status(200).json({
      success: true,
      message: '\u2705 PlatePulse fully seeded!',
      summary: { users: 14, donations: 12, missions: 5, products: 12, orders: 3, communityShares: 4, wasteRequests: 3, impactLogs: 9 },
      testAccounts: {
        password:   'Password@123',
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
    console.error('SEED ERROR:', err);
    return res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
};
