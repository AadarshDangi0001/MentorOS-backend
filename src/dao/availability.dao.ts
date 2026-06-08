import { Types } from 'mongoose';
import { Availability } from '../models/Availability.model';
import { IAvailabilitySlot } from '../types/marketplace.types';

export class AvailabilityDAO {
  async create(data: {
    mentor: Types.ObjectId;
    startTime: Date;
    endTime: Date;
  }): Promise<IAvailabilitySlot> {
    return Availability.create(data);
  }

  async findById(id: string): Promise<IAvailabilitySlot | null> {
    return Availability.findById(id);
  }

  async findByMentor(mentorId: string, onlyAvailable = false): Promise<IAvailabilitySlot[]> {
    const query: Record<string, unknown> = {
      mentor: mentorId,
      startTime: { $gte: new Date() }, // only future slots
    };
    if (onlyAvailable) query.isBooked = false;
    return Availability.find(query).sort({ startTime: 1 });
  }

  /** Atomic: mark booked only if still free. Returns null if already taken. */
  async markBooked(id: string): Promise<IAvailabilitySlot | null> {
    return Availability.findOneAndUpdate(
      { _id: id, isBooked: false },
      { $set: { isBooked: true } },
      { new: true }
    );
  }

  async markFree(id: string): Promise<void> {
    await Availability.findByIdAndUpdate(id, { $set: { isBooked: false } });
  }

  /** Check overlap for a mentor before creating a new slot */
  async hasOverlap(
    mentorId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<boolean> {
    const query: Record<string, unknown> = {
      mentor: mentorId,
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
      ],
    };
    if (excludeId) query._id = { $ne: excludeId };
    const count = await Availability.countDocuments(query);
    return count > 0;
  }

  async delete(id: string, mentorId: string): Promise<IAvailabilitySlot | null> {
    // Only allow deletion of un-booked future slots
    return Availability.findOneAndDelete({
      _id: id,
      mentor: mentorId,
      isBooked: false,
      startTime: { $gt: new Date() },
    });
  }
}

export const availabilityDAO = new AvailabilityDAO();
