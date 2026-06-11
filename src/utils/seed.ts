import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { Mentor } from '../models/Mentor.model';
import { Package } from '../models/Package.model';
import { Availability } from '../models/Availability.model';
import { Booking } from '../models/Booking.model';
import { UserRole, UserStatus, MentorStatus, AuthProvider } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/propeers';

async function seed() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    // Clean up
    console.log('Cleaning existing collection data...');
    await User.deleteMany({});
    await Mentor.deleteMany({});
    await Package.deleteMany({});
    await Availability.deleteMany({});
    await Booking.deleteMany({});
    console.log('Database cleaned.');

    // ─── 1. CREATE MENTORS ──────────────────────────────────────────

    // Mentor 1: Ananya Gupta
    const userAnanya = await User.create({
      name: 'Ananya Gupta',
      email: 'ananya.gupta@google.com',
      password: 'Password@123', // Will be hashed by pre-save hook
      authProvider: AuthProvider.LOCAL,
      role: UserRole.MENTOR,
      status: UserStatus.ACTIVE,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bio: 'Staff Engineer at Google with 8+ years of experience in distributed systems.',
      isEmailVerified: true,
    });

    await Mentor.create({
      user: userAnanya._id,
      mentorStatus: MentorStatus.APPROVED,
      expertise: ['System Design', 'Career Pivot', 'Java'],
      experience: 8,
      currentRole: 'Staff Engineer',
      company: 'Google',
      linkedIn: 'https://linkedin.com/in/ananyagupta',
      github: 'https://github.com/ananyagupta',
      hourlyRate: 1499,
      languages: ['English', 'Hindi'],
      rating: 4.9,
      totalReviews: 120,
      totalSessions: 300,
      isVerified: true,
    });

    // Mentor 2: David Larsson
    const userDavid = await User.create({
      name: 'David Larsson',
      email: 'david.larsson@meta.com',
      password: 'Password@123',
      authProvider: AuthProvider.LOCAL,
      role: UserRole.MENTOR,
      status: UserStatus.ACTIVE,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Senior Frontend Developer at Meta specializing in React, Node.js, and Web3 apps.',
      isEmailVerified: true,
    });

    await Mentor.create({
      user: userDavid._id,
      mentorStatus: MentorStatus.APPROVED,
      expertise: ['React', 'Web3', 'Node.js'],
      experience: 6,
      currentRole: 'Senior Developer',
      company: 'Meta',
      linkedIn: 'https://linkedin.com/in/davidlarsson',
      github: 'https://github.com/davidlarsson',
      hourlyRate: 999,
      languages: ['English', 'Swedish'],
      rating: 5.0,
      totalReviews: 85,
      totalSessions: 140,
      isVerified: true,
    });

    // Mentor 3: Maya Patel
    const userMaya = await User.create({
      name: 'Maya Patel',
      email: 'maya.patel@amazon.com',
      password: 'Password@123',
      authProvider: AuthProvider.LOCAL,
      role: UserRole.MENTOR,
      status: UserStatus.ACTIVE,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'Product Lead at Amazon. Ex-Stripe, ex-Uber. Passionate about product strategy, leadership coaching, and UI/UX design.',
      isEmailVerified: true,
    });

    await Mentor.create({
      user: userMaya._id,
      mentorStatus: MentorStatus.APPROVED,
      expertise: ['Product Strategy', 'Leadership', 'UI/UX'],
      experience: 10,
      currentRole: 'Product Lead',
      company: 'Amazon',
      linkedIn: 'https://linkedin.com/in/mayapatel',
      hourlyRate: 2499,
      languages: ['English', 'Gujarati'],
      rating: 4.8,
      totalReviews: 210,
      totalSessions: 550,
      isVerified: true,
    });

    console.log('Mentors created successfully!');

    // ─── 2. CREATE PACKAGES ─────────────────────────────────────────

    // Packages for Ananya
    await Package.create({
      mentor: userAnanya._id,
      title: '1:1 Career Consultation',
      duration: 45,
      price: 1499,
      description: 'Get feedback on your resume, mock interview prep, or career pivot plan.',
      isActive: true,
    });

    await Package.create({
      mentor: userAnanya._id,
      title: 'System Design Deep Dive',
      duration: 60,
      price: 2499,
      description: 'Deep dive into system design problems like scaling, database selection, and API design.',
      isActive: true,
    });

    // Packages for David
    await Package.create({
      mentor: userDavid._id,
      title: 'Frontend Career Accelerator',
      duration: 60,
      price: 999,
      description: 'Review React codebases, architecture, and frontend systems layout.',
      isActive: true,
    });

    // Packages for Maya
    await Package.create({
      mentor: userMaya._id,
      title: 'Product Management Coaching',
      duration: 60,
      price: 2499,
      description: 'Prepare for PM interviews, strategy questions, or metric evaluation.',
      isActive: true,
    });

    console.log('Packages created successfully!');

    // ─── 3. CREATE AVAILABILITY SLOTS ───────────────────────────────
    // Let's create slots for tomorrow and the day after tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10 AM tomorrow

    const slot1Start = new Date(tomorrow);
    const slot1End = new Date(tomorrow);
    slot1End.setHours(slot1End.getHours() + 1); // 11 AM tomorrow

    const slot2Start = new Date(tomorrow);
    slot2Start.setHours(14, 0, 0, 0); // 2 PM tomorrow
    const slot2End = new Date(tomorrow);
    slot2End.setHours(15, 0, 0, 0); // 3 PM tomorrow

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(11, 0, 0, 0); // 11 AM day after

    const slot3Start = new Date(dayAfter);
    const slot3End = new Date(dayAfter);
    slot3End.setHours(slot3End.getHours() + 1);

    // Create slots for Ananya
    await Availability.create({
      mentor: userAnanya._id,
      startTime: slot1Start,
      endTime: slot1End,
      isBooked: false,
    });

    await Availability.create({
      mentor: userAnanya._id,
      startTime: slot2Start,
      endTime: slot2End,
      isBooked: false,
    });

    // Create slots for David
    await Availability.create({
      mentor: userDavid._id,
      startTime: slot1Start,
      endTime: slot1End,
      isBooked: false,
    });

    // Create slots for Maya
    await Availability.create({
      mentor: userMaya._id,
      startTime: slot3Start,
      endTime: slot3End,
      isBooked: false,
    });

    console.log('Availability slots created successfully!');

    // ─── 4. CREATE A TEST STUDENT ───────────────────────────────────
    await User.create({
      name: 'John Doe',
      email: 'student@test.com',
      password: 'Password@123',
      authProvider: AuthProvider.LOCAL,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      bio: 'Aspiring software engineer looking for backend mentorship.',
      isEmailVerified: true,
    });

    console.log('Test student user created successfully!');
    console.log('Database seeding finished!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
