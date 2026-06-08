import { Types } from 'mongoose';
import { Student } from '../models/Student.model';
import { Mentor } from '../models/Mentor.model';
import { IStudent, IMentor } from '../types';

/**
 * ProfileDAO — DB calls for Student and Mentor profile creation.
 * Kept together since both are created at registration time.
 */
export class ProfileDAO {
  async createStudentProfile(userId: Types.ObjectId): Promise<IStudent> {
    return Student.create({ user: userId });
  }

  async createMentorProfile(userId: Types.ObjectId): Promise<IMentor> {
    return Mentor.create({ user: userId });
  }

  async findStudentByUserId(userId: string): Promise<IStudent | null> {
    return Student.findOne({ user: userId });
  }

  async findMentorByUserId(userId: string): Promise<IMentor | null> {
    return Mentor.findOne({ user: userId });
  }
}

export const profileDAO = new ProfileDAO();
