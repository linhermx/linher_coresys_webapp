import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;

const toOrigin = (urlValue) => {
  if (!urlValue) {
    return null;
  }

  try {
    return new URL(urlValue).origin;
  } catch {
    return String(urlValue).replace(/\/+$/, '');
  }
};

const frontendOrigin = toOrigin(process.env.FRONTEND_URL || process.env.FRONTEND_APP_URL);
const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):517\d$/;
const allowedOrigins = [
  frontendOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || localDevOriginPattern.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS_NOT_ALLOWED'));
  },
  credentials: true
}));
app.use(express.json());

const v1 = express.Router();

v1.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Coresys API está en línea.'
  });
});

app.use('/api/v1', v1);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
