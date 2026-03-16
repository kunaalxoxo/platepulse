/**
 * Calculate dynamic discount based on days left until expiry.
 * 
 * @param {Date|String} expiresAt Target expiration date
 * @returns {Object} { discount: number, isActive: boolean, urgentBadge: boolean }
 */
const calculateDiscount = (expiresAt) => {
  const now = Date.now();
  const expiresMs = new Date(expiresAt).getTime();
  const daysLeft = (expiresMs - now) / (1000 * 60 * 60 * 24);

  if (daysLeft >= 7) {
    return { discount: 0, isActive: false, urgentBadge: false }; // Too early for marketplace
  }
  if (daysLeft >= 4) {
    return { discount: 20, isActive: true, urgentBadge: false };
  }
  if (daysLeft >= 2) {
    return { discount: 40, isActive: true, urgentBadge: false };
  }
  if (daysLeft >= 1) {
    return { discount: 70, isActive: true, urgentBadge: false };
  }
  if (daysLeft >= 0) {
    return { discount: 80, isActive: true, urgentBadge: true }; // < 24 hours left
  }
  
  // Negative days left -> Expired
  return { discount: 0, isActive: false, urgentBadge: false };
};

/**
 * Applies the given discount percentage to an MRP.
 * 
 * @param {number} mrp Maximum Retail Price
 * @param {number} discountPercent Percentage (0-100)
 * @returns {number} Final price discounted
 */
const applyDiscount = (mrp, discountPercent) => {
  if (discountPercent === 0) return mrp;
  return parseFloat((mrp * (1 - discountPercent / 100)).toFixed(2));
};

module.exports = { calculateDiscount, applyDiscount };
