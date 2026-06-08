import { Types } from 'mongoose';
import { Package } from '../models/Package.model';
import { IPackage } from '../types/marketplace.types';

export class PackageDAO {
  async create(data: {
    mentor: Types.ObjectId;
    title: string;
    duration: number;
    price: number;
    description?: string;
  }): Promise<IPackage> {
    return Package.create(data);
  }

  async findById(id: string): Promise<IPackage | null> {
    return Package.findById(id);
  }

  async findByMentor(mentorId: string, onlyActive = true): Promise<IPackage[]> {
    const query: Record<string, unknown> = { mentor: mentorId };
    if (onlyActive) query.isActive = true;
    return Package.find(query).sort({ price: 1 });
  }

  async update(
    id: string,
    mentorId: string,
    data: Partial<Pick<IPackage, 'title' | 'duration' | 'price' | 'description' | 'isActive'>>
  ): Promise<IPackage | null> {
    return Package.findOneAndUpdate(
      { _id: id, mentor: mentorId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(id: string, mentorId: string): Promise<IPackage | null> {
    return Package.findOneAndDelete({ _id: id, mentor: mentorId });
  }
}

export const packageDAO = new PackageDAO();
