const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const env = require('../config/env');

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Use memory storage (no disk writes)
const storage = multer.memoryStorage();

// File validation
const fileFilter = (req, file, cb) => {
  const allowedMimetypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `platepulse/${folder}`,
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Middleware wrapper
const uploadSingle = (fieldName, folder = 'general') => {
  return (req, res, next) => {
    const multerUpload = upload.single(fieldName);

    multerUpload(req, res, async (err) => {
      if (err) {
        if (err.message === 'Invalid file type' || err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Invalid file type or size' });
        }
        return res.status(500).json({ success: false, message: 'File upload error' });
      }

      if (!req.file) {
        return next(); // Proceed without file if not mandatory
      }

      try {
        const result = await uploadToCloudinary(req.file.buffer, folder);
        req.uploadedFile = { url: result.secure_url, public_id: result.public_id };
        next();
      } catch (uploadErr) {
        return res.status(500).json({ success: false, message: 'Cloudinary upload failed' });
      }
    });
  };
};

module.exports = { uploadSingle };
