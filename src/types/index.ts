import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────
export enum UserRole {
  BLOCKED = 'blocked',
  DELETED = 'deleted',
  STUDENT = 'student',
  MENTOR = 'mentor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum MentorStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ─── OAuth ────────────────────────────────────────────────────
export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

// ─── User ─────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  bio?: string;
  authProvider: AuthProvider;
  googleId?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
}

// ─── Student ──────────────────────────────────────────────────
export interface IStudent extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  college?: string;
  degree?: string;
  graduationYear?: number;
  skills: string[];
  interests: string[];
  linkedIn?: string;
  github?: string;
  resumeUrl?: string;
  sessionsBooked: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Mentor ───────────────────────────────────────────────────
export interface IMentor extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  mentorStatus: MentorStatus;
  expertise: string[];
  experience: number; // years
  currentRole?: string;
  company?: string;
  linkedIn?: string;
  github?: string;
  hourlyRate?: number;
  languages: string[];
  rating: number;
  totalReviews: number;
  totalSessions: number;
  availability: IAvailabilitySlot[];
  isVerified: boolean;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAvailabilitySlot {
  day: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

// ─── Auth ─────────────────────────────────────────────────────
export interface IAuthRequest extends Request {
  user?: IUser;
  role?: UserRole;
}

export interface ITokenPayload {
  id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── API Response ─────────────────────────────────────────────
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ─── Pagination ───────────────────────────────────────────────
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

