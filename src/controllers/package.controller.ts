import { Request, Response, NextFunction } from 'express';
import { packageService } from '../services/package.service';
import { sendSuccess, sendCreated } from '../utils/ApiResponse';
import { IAuthRequest } from '../types';

export class PackageController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id.toString();
      const pkg = await packageService.create(userId, req.body);
      sendCreated(res, { package: pkg }, 'Package created');
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id.toString();
      const pkg = await packageService.update(userId, req.params.id, req.body);
      sendSuccess(res, { package: pkg }, 'Package updated');
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id.toString();
      await packageService.delete(userId, req.params.id);
      sendSuccess(res, null, 'Package deleted');
    } catch (e) { next(e); }
  }

  async getByMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const packages = await packageService.getByMentor(req.params.mentorId);
      sendSuccess(res, { packages });
    } catch (e) { next(e); }
  }
}

export const packageController = new PackageController();
