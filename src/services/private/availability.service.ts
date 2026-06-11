import { Types } from 'mongoose';
import { availabilityDAO } from '../../dao/availability.dao';
import { ApiError } from '../../utils/ApiError';
import { IAvailabilitySlot } from '../../types/marketplace.types';
import { Mentor } from '../../models/Mentor.model';
import { MentorStatus } from '../../types';

export class AvailabilityService {
  private async assertApprovedMentor(userId: string) {
    const mentor = await Mentor.findOne({ user: userId, mentorStatus: MentorStatus.APPROVED });
    if (!mentor) throw ApiError.forbidden('Only approved mentors can manage availability');
    return mentor;
  }

  async create(userId: string, startTime: Date, endTime: Date): Promise<IAvailabilitySlot> {
    await this.assertApprovedMentor(userId);

    if (startTime <= new Date()) throw ApiError.badRequest('Slot must be in the future');
    if (endTime <= startTime) throw ApiError.badRequest('End time must be after start time');

    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    if (startTime > oneMonthFromNow) {
      throw ApiError.badRequest('You can only create availability slots within 1 month from now');
    }

    const durationMs = endTime.getTime() - startTime.getTime();
    if (durationMs !== 60 * 60 * 1000) {
      throw ApiError.badRequest('Slot duration must be exactly 1 hour (60 minutes)');
    }

    const overlap = await availabilityDAO.hasOverlap(userId, startTime, endTime);
    if (overlap) throw ApiError.conflict('Slot overlaps with an existing slot');

    return availabilityDAO.create({
      mentor: new Types.ObjectId(userId),
      startTime,
      endTime,
    });
  }

  async getByMentor(mentorUserId: string, onlyAvailable: boolean): Promise<IAvailabilitySlot[]> {
    return availabilityDAO.findByMentor(mentorUserId, onlyAvailable);
  }

  async delete(userId: string, slotId: string): Promise<void> {
    const slot = await availabilityDAO.delete(slotId, userId);
    if (!slot) throw ApiError.notFound('Slot not found, already booked, or in the past');
  }
}

export const availabilityService = new AvailabilityService();
