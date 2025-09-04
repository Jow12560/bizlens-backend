import multer from 'multer';
import { transformThaiToEnglish } from '../utils/filenameUtils.js';

// Create multer storage configuration
const storage = multer.memoryStorage();

// Create multer upload configuration with filename transformation
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware to transform filenames
export const transformFilename = (req, res, next) => {
  // For single file uploads (using upload.single)
  if (req.file) {
    req.file.originalname = transformThaiToEnglish(req.file.originalname);
  }
  // For multiple file uploads (using upload.fields)
  if (req.files) {
    Object.keys(req.files).forEach(key => {
      if (Array.isArray(req.files[key])) {
        req.files[key].forEach(file => {
          file.originalname = transformThaiToEnglish(file.originalname);
        });
      }
    });
  }
  next();
};

// Export the configured multer upload
export default upload; 