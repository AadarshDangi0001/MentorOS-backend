import { Response } from 'express';
import { IApiResponse } from '../types';

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: IApiResponse['meta']
): Response => {
  const response: IApiResponse<T> = {
    success: statusCode < 400,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
};

export const sendSuccess = <T>(res: Response, data: T, message = 'Success', code = 200) =>
  sendResponse(res, code, message, data);

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully') =>
  sendResponse(res, 201, message, data);

export const sendNoContent = (res: Response) => res.status(204).send();
