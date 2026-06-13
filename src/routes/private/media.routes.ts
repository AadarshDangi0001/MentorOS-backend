import { Router, Request } from 'express';
import multer from 'multer';
import { mediaController } from '../../controllers/private/media.controller';
import { ApiError } from '../../utils/ApiError';
import { authenticate } from '../../middleware/auth/authenticate';

const router = Router();

// Configure multer memory storage
const storage = multer.memoryStorage();

// File filter restricting to images (jpg, jpeg, png, webp)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Single file upload route under 'avatar' field name (authenticated)
router.post(
  '/upload',
  authenticate,
  (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(ApiError.badRequest('File size exceeds the limit of 5MB'));
        }
        return next(ApiError.badRequest(err.message));
      } else if (err) {
        return next(ApiError.badRequest(err.message));
      }
      next();
    });
  },
  mediaController.upload.bind(mediaController)
);

export default router;
