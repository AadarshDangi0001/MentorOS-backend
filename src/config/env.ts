import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  IS_PROD: process.env.NODE_ENV === 'production',

  MONGO_URI: required('MONGO_URI'),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE || '15m',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@propeers.com',
  FROM_NAME: process.env.FROM_NAME || 'Propeers',

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  get FRONTEND_URL(): string {
    const urls = this.CLIENT_URL.split(',').map((u) => u.trim());
    return urls.find((u) => !u.includes(':3000')) || urls[0] || 'http://localhost:5173';
  },
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  COOKIE_SECRET: required('COOKIE_SECRET'),

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  GOOGLE_CLIENT_ID: required('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: required('GOOGLE_CLIENT_SECRET'),
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/public/auth/google/callback',

  // Razorpay
  RAZORPAY_KEY_ID: required('RAZORPAY_KEY_ID'),
  RAZORPAY_WEBHOOK_SECRET: required('RAZORPAY_WEBHOOK_SECRET'),
  RAZORPAY_KEY_SECRET: required('RAZORPAY_KEY_SECRET'),

  // ImageKit
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || '',
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || '',
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT || '',

  // SheryMeet
  SHERYMEET_API_KEY: process.env.SHERYMEET_API_KEY || 'sm_live_your_actual_api_key_here',
  SHERYMEET_CLIENT_SECRET: process.env.SHERYMEET_CLIENT_SECRET || 'sm_sec_your_actual_plaintext_secret_here',
  SHERYMEET_BASE_URL: process.env.SHERYMEET_BASE_URL || 'http://localhost:3001',
};
