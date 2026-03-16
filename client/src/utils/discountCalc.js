export const calculateDiscount = (originalPrice, expiresAt) => {
  const hoursLeft = (new Date(expiresAt) - Date.now()) / (1000 * 60 * 60);
  let discountPercent = 0;
  if (hoursLeft <= 2) discountPercent = 70;
  else if (hoursLeft <= 6) discountPercent = 50;
  else if (hoursLeft <= 12) discountPercent = 35;
  else if (hoursLeft <= 24) discountPercent = 20;
  else if (hoursLeft <= 48) discountPercent = 10;
  const discountedPrice = originalPrice * (1 - discountPercent / 100);
  return { discountPercent, discountedPrice: Math.round(discountedPrice * 100) / 100 };
};
