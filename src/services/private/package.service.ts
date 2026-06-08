import { Types } from 'mongoose';
import { packageDAO } from '../../dao/package.dao';
import { ApiError } from '../../utils/ApiError';
import { IPackage } from '../../types/marketplace.types';
import { Mentor } from '../../models/Mentor.model';
import { MentorStatus } from '../../types';

export class PackageService {
  private async assertApprovedMentor(userId: string) {
    const mentor = await Mentor.findOne({ user: userId, mentorStatus: MentorStatus.APPROVED });
    if (!mentor) throw ApiError.forbidden('Only approved mentors can manage packages');
    return mentor;
  }

  async create(
    userId: string,
    data: { title: string; duration: number; price: number; description?: string }
  ): Promise<IPackage> {
    const mentor = await this.assertApprovedMentor(userId);
    return packageDAO.create({ mentor: mentor.user as Types.ObjectId, ...data });
  }

  async update(
    userId: string,
    packageId: string,
    data: Partial<Pick<IPackage, 'title' | 'duration' | 'price' | 'description' | 'isActive'>>
  ): Promise<IPackage> {
    const pkg = await packageDAO.update(packageId, userId, data);
    if (!pkg) throw ApiError.notFound('Package not found or not yours');
    return pkg;
  }

  async delete(userId: string, packageId: string): Promise<void> {
    const pkg = await packageDAO.delete(packageId, userId);
    if (!pkg) throw ApiError.notFound('Package not found or not yours');
  }

  async getByMentor(mentorUserId: string): Promise<IPackage[]> {
    return packageDAO.findByMentor(mentorUserId, true);
  }
}

export const packageService = new PackageService();
