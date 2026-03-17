/**
 * Calculate dynamic discount based on days left until expiry.
 * Products are ALWAYS active if not yet expired — discount tier determines pricing.
 */
const calculateDiscount = (expiresAt) => {
  const now = Date.now();
  const expiresMs = new Date(expiresAt).getTime();
  const daysLeft = (expiresMs - now) / (1000 * 60 * 60 * 24);

  // Expired
  if (daysLeft < 0) {
    return { discount: 0, isActive: false, urgentBadge: false };
  }

  // < 24 hours — urgent, heavy discount
  if (daysLeft < 1) {
    return { discount: 80, isActive: true, urgentBadge: true };
  }

  // 1–2 days
  if (daysLeft < 2) {
    return { discount: 70, isActive: true, urgentBadge: false };
  }

  // 2–4 days
  if (daysLeft < 4) {
    return { discount: 40, isActive: true, urgentBadge: false };
  }

  // 4–7 days
  if (daysLeft < 7) {
    return { discount: 20, isActive: true, urgentBadge: false };
  }

  // > 7 days — still listed but at a small early-bird discount
  return { discount: 10, isActive: true, urgentBadge: false };
};

const applyDiscount = (mrp, discountPercent) => {
  if (discountPercent === 0) return mrp;
  return parseFloat((mrp * (1 - discountPercent / 100)).toFixed(2));
};

module.exports = { calculateDiscount, applyDiscount };
