import nodemailer from 'nodemailer';
import { ENV } from '../config/env';
import logger from './logger';

interface IEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465,
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
});

export const sendEmail = async (options: IEmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"${ENV.FROM_NAME}" <${ENV.FROM_EMAIL}>`,
      ...options,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error('Email send failed:', error);
    throw error;
  }
};

export const emailTemplates = {
verifyEmail: (name: string, token: string, clientUrl: string) => ({
  subject: 'Verify your Propeers account',
  html: `
    <h2>Welcome to Propeers, ${name}!</h2>
    <p>Please verify your email by clicking the link below:</p>

    <a
      href="${clientUrl}/verify-email/${token}"
      style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block"
    >
      Verify Email
    </a>

    <p>This link expires in 24 hours.</p>
    <p>If you didn't create an account, please ignore this email.</p>
  `,
}),
  resetPassword: (name: string, token: string, clientUrl: string) => ({
    subject: 'Reset your Propeers password',
    html: `
      <h2>Hi ${name},</h2>
      <p>You requested a password reset. Click the button below:</p>
      <a href="${clientUrl}/reset-password/${token}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Reset Password</a>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
  }),

  welcomeAfterVerify: (name: string) => ({
    subject: 'Welcome to Propeers 🎉',
    html: `
      <h2>You're all set, ${name}!</h2>
      <p>Your account is now verified. Start exploring mentors and growing your career.</p>
    `,
  }),
};
