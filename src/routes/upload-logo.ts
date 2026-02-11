import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { saveLogoFile } from '../lib/image-storage';
import { isValidLogoFormat } from '../lib/logo-overlay';
import { LOGO } from '../lib/constants';

const router = Router();

/**
 * Configure multer for file uploads
 * Stores files in memory for processing
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: LOGO.MAX_FILE_SIZE, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (isValidLogoFormat(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file format. Supported formats: ${LOGO.SUPPORTED_FORMATS.join(', ')}`));
    }
  },
});

/**
 * Upload logo endpoint
 * 
 * POST /api/upload-logo
 * 
 * Accepts logo file upload and saves it to the logos directory
 * 
 * @returns Logo URL and filename
 */
router.post('/', upload.single('logo'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No logo file provided',
      });
    }

    console.log(`[Upload Logo] Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Save logo file
    const { filename, url } = saveLogoFile(req.file.buffer, req.file.originalname);

    console.log(`[Upload Logo] File uploaded successfully: ${filename}`);

    return res.json({
      success: true,
      filename,
      url,
    });
  } catch (error) {
    console.error('[Upload Logo] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload logo';
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

export default router;
