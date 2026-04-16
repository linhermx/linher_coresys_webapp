import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

import { AppError } from './errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsBaseDir = path.resolve(__dirname, '../../storage/uploads');
const ticketUploadsDir = path.join(uploadsBaseDir, 'tickets');

fs.mkdirSync(ticketUploadsDir, { recursive: true });

const MAX_TICKET_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TICKET_ATTACHMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain'
]);

const sanitizeFileName = (value) => (
  String(value || 'archivo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, ticketUploadsDir),
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 12);
    const baseName = sanitizeFileName(path.basename(file.originalname || 'archivo', ext));
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    callback(null, `${Date.now()}-${randomSuffix}-${baseName || 'archivo'}${ext}`);
  }
});

const ticketAttachmentMulter = multer({
  storage,
  limits: {
    files: 1,
    fileSize: MAX_TICKET_ATTACHMENT_BYTES
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_TICKET_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
      callback(new AppError('Tipo de archivo no permitido. Usa JPG, PNG, WEBP, PDF o TXT.', {
        statusCode: 400,
        code: 'INVALID_ATTACHMENT_TYPE',
        details: {
          mimetype: file.mimetype
        }
      }));
      return;
    }

    callback(null, true);
  }
});

export const ticketAttachmentUpload = (req, res, next) => {
  ticketAttachmentMulter.single('file')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('El archivo supera el límite de 5 MB.', {
          statusCode: 413,
          code: 'ATTACHMENT_TOO_LARGE'
        }));
        return;
      }

      next(new AppError('No fue posible procesar el archivo adjunto.', {
        statusCode: 400,
        code: 'ATTACHMENT_UPLOAD_ERROR',
        details: {
          multer_code: error.code
        }
      }));
      return;
    }

    next(error);
  });
};

export const ticketAttachmentConstraints = Object.freeze({
  max_file_size_bytes: MAX_TICKET_ATTACHMENT_BYTES,
  allowed_mime_types: Array.from(ALLOWED_TICKET_ATTACHMENT_MIME_TYPES),
  upload_field: 'file'
});

export const uploadsStaticDir = uploadsBaseDir;
