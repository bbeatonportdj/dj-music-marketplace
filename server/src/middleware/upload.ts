import multer from 'multer';
import path from 'path';

// Use memory storage to allow buffering files before deciding between Local or Cloud storage upload
const storage = multer.memoryStorage();

const ALLOWED_AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.flac', '.aac', '.ogg'];
const ALLOWED_AUDIO_MIMES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp4',
  'audio/x-m4a',
  'audio/flac',
  'audio/x-flac',
  'audio/aac',
  'audio/ogg'
];

const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max file size for tracks
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (file.fieldname === 'audioFile') {
      if (ALLOWED_AUDIO_EXTS.includes(ext) && ALLOWED_AUDIO_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid audio file type. Allowed formats: MP3, WAV, M4A, FLAC, AAC, OGG'));
      }
    } else if (file.fieldname === 'artworkFile' || file.fieldname === 'slipFile') {
      if (ALLOWED_IMAGE_EXTS.includes(ext) && ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid image file type. Allowed formats: JPG, JPEG, PNG, WEBP, GIF'));
      }
    } else {
      cb(new Error('Unknown upload field'));
    }
  }
});
