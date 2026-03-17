const Product = require('../models/Product');
const { calculateDiscount, applyDiscount } = require('../services/discount.service');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── POST /api/v1/products ───────────────────────────────────────────────

const createProduct = asyncHandler(async (req, res) => {
  const { name, category, mrp, quantity, expiresAt } = req.body;

  let storeLocation;
  try {
    storeLocation = typeof req.body.storeLocation === 'string'
      ? JSON.parse(req.body.storeLocation)
      : req.body.storeLocation;
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid storeLocation format' });
  }

  if (!name || !mrp || !quantity || !expiresAt || !storeLocation?.coordinates) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const imageUrl = req.uploadedFile?.url;
  const [lng, lat] = storeLocation.coordinates;
  const parsedMrp = parseFloat(mrp);
  const discResult = calculateDiscount(expiresAt);

  const product = await Product.create({
    retailer: req.user.id,
    name,
    category,
    mrp: parsedMrp,
    finalPrice: applyDiscount(parsedMrp, discResult.discount),
    discountPercent: discResult.discount,
    image: imageUrl,
    quantity: parseInt(quantity, 10),
    expiresAt,
    storeLocation: {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)],
      address: storeLocation.address,
    },
    isActive: discResult.isActive,
    urgentBadge: discResult.urgentBadge,
  });

  return res.status(201).json({ success: true, message: 'Product listed successfully', data: product });
});

// ─── GET /api/v1/products ────────────────────────────────────────────────
//
// Behaviour:
//   • With lat + lng  → $geoNear sorted by distance, then by discountPercent desc
//   • Without lat/lng → simple find(), sorted by discountPercent desc
//
// The frontend always sends a first call WITHOUT coordinates (instant load),
// then a second call WITH coordinates once GPS resolves.  The frontend only
// replaces the product list if the geo call returns ≥1 result, so users
// never see a blank page.

const getProducts = asyncHandler(async (req, res) => {
  const { category, lat, lng, radius, urgentOnly, limit = 50 } = req.query;
  const parsedLimit = Math.min(parseInt(limit, 10), 100);

  const baseFilter = { isActive: true };
  if (category)            baseFilter.category    = category;
  if (urgentOnly === 'true') baseFilter.urgentBadge = true;

  let products;

  if (lat && lng) {
    const maxDist = (parseInt(radius, 10) || 50) * 1000; // metres

    const geoResults = await Product.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: 'distance',
          maxDistance: maxDist,
          spherical: true,
          query: baseFilter,
        },
      },
      // Within the geo radius: highest discount first
      { $sort: { discountPercent: -1, distance: 1 } },
      { $limit: parsedLimit },
    ]);

    await Product.populate(geoResults, { path: 'retailer', select: 'name orgName' });

    // Return the geo results (may be empty — frontend handles fallback)
    products = geoResults;
  } else {
    // No location provided — return everything active, best discount first
    products = await Product.find(baseFilter)
      .populate('retailer', 'name orgName')
      .sort({ discountPercent: -1, createdAt: -1 })
      .limit(parsedLimit);
  }

  return res.status(200).json({
    success: true,
    data: products,
    pagination: { count: products.length },
  });
});

// ─── GET /api/v1/products/:id ────────────────────────────────────────────

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('retailer', 'name orgName storeLocation phone');

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  return res.status(200).json({ success: true, data: product });
});

// ─── GET /api/v1/products/my-products ────────────────────────────────────

const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ retailer: req.user.id })
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, data: products });
});

// ─── PATCH /api/v1/products/:id ──────────────────────────────────────────

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (product.retailer.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
  }

  const updates = req.body;
  delete updates.retailer;

  if (updates.expiresAt || updates.mrp) {
    const tgtExpiry = updates.expiresAt || product.expiresAt;
    const tgtMrp    = updates.mrp       || product.mrp;
    const discResult = calculateDiscount(tgtExpiry);
    updates.discountPercent = discResult.discount;
    updates.isActive        = discResult.isActive;
    updates.urgentBadge     = discResult.urgentBadge;
    updates.finalPrice      = applyDiscount(tgtMrp, discResult.discount);
  }

  Object.assign(product, updates);
  await product.save();

  return res.status(200).json({ success: true, data: product });
});

// ─── DELETE /api/v1/products/:id ─────────────────────────────────────────

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (product.retailer.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete' });
  }

  product.isActive = false;
  await product.save();

  return res.status(200).json({ success: true, message: 'Product deactivated successfully' });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  deleteProduct,
};
