const vision = require('@google-cloud/vision');
const env = require('../config/env');
const logger = require('../utils/logger');

let visionClient;
if (env.GOOGLE_VISION_API_KEY) {
  // Simplistic setup for api key — in prod should use credentials JSON
  visionClient = new vision.ImageAnnotatorClient({
    apiKey: env.GOOGLE_VISION_API_KEY,
  });
}

const foodKeywords = [
  'food', 'meal', 'dish', 'cuisine', 'ingredient',
  'vegetable', 'fruit', 'bread', 'meat', 'drink', 'beverage',
  'cooked', 'raw', 'packaged', 'fresh'
];

const validateFoodImage = async (imageUrl) => {
  if (!env.GOOGLE_VISION_API_KEY || !visionClient) {
    logger.warn('Google Vision API not configured. Returning mock AI validation.');
    return { isFood: true, confidence: 85, labels: ['food', 'mock'], isSafe: true };
  }

  try {
    const [result] = await visionClient.annotateImage({
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'SAFE_SEARCH_DETECTION' }
      ],
      image: { source: { imageUri: imageUrl } }
    });

    const labels = result.labelAnnotations || [];
    const safeSearch = result.safeSearchAnnotation || {};

    const matchedLabels = labels.filter(l => 
      foodKeywords.some(kw => l.description.toLowerCase().includes(kw))
    );

    const confidence = matchedLabels.length > 0 ? (matchedLabels[0].score * 100) : 0;
    
    // Check if the image violates safety guidelines
    const isSafe = ['UNLIKELY', 'VERY_UNLIKELY', 'UNKNOWN'].includes(safeSearch.adult);
    const isFood = confidence >= 40;

    return {
      isFood,
      confidence: Math.round(confidence),
      labels: labels.slice(0, 5).map(l => l.description),
      isSafe
    };
  } catch (error) {
    logger.error(`AI Vision error: ${error.message}`);
    // Fail semi-open: assume not explicitly unsafe, but 0 confidence food
    return { isFood: false, confidence: 0, labels: [], isSafe: true };
  }
};

module.exports = { validateFoodImage };
