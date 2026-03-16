const cron = require('node-cron');
const Product = require('../models/Product');
const { calculateDiscount, applyDiscount } = require('../services/discount.service');
const { getIO } = require('../socket/socket.server');
const logger = require('../utils/logger');

// Run every hour
const startDiscountJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      // Find all products that haven't expired yet
      const products = await Product.find({ 
        expiresAt: { $gte: new Date() } 
      });

      if (products.length === 0) return;

      const io = getIO();
      let updatedCount = 0;

      for (const product of products) {
        const result = calculateDiscount(product.expiresAt);
        
        // Only update if discount/urgency state actually changed
        if (
          product.discountPercent !== result.discount ||
          product.isActive !== result.isActive ||
          product.urgentBadge !== result.urgentBadge
        ) {
          product.discountPercent = result.discount;
          product.isActive = result.isActive;
          product.urgentBadge = result.urgentBadge;
          product.finalPrice = applyDiscount(product.mrp, result.discount);
          
          await product.save();
          updatedCount++;

          // If still active and discounted, push live update to online consumers
          if (result.isActive) {
            io.emit('price_updated', {
              productId: product._id,
              finalPrice: product.finalPrice,
              discountPercent: product.discountPercent,
              urgentBadge: product.urgentBadge
            });
          }
        }
      }

      logger.info(`[DISCOUNT JOB] Updated prices for ${updatedCount} products`);
    } catch (error) {
      logger.error(`[DISCOUNT JOB] Error: ${error.message}`);
    }
  });

  logger.info('[CRON] Discount job scheduled (Every hour)');
};

module.exports = { startDiscountJob };
