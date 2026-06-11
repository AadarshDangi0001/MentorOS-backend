import ImageKit, { toFile } from '@imagekit/nodejs';
import { ENV } from '../config/env';
import logger from './logger';

let imagekit: ImageKit | null = null;

if (ENV.IMAGEKIT_PRIVATE_KEY) {
  imagekit = new ImageKit({
    privateKey: ENV.IMAGEKIT_PRIVATE_KEY,
  });
} else {
  logger.warn('ImageKit credentials are not configured. Avatar uploads will fail.');
}

/**
 * Uploads a file buffer to ImageKit and returns the public URL.
 * Supports image files (Buffer) natively.
 */
export const uploadToImageKit = async (
  fileBuffer: Buffer,
  fileName: string,
  folder: string = '/avatars'
): Promise<string> => {
  if (!imagekit) {
    throw new Error(
      'ImageKit is not configured. Please define IMAGEKIT_PRIVATE_KEY in your environment variables.'
    );
  }

  try {
    const file = await toFile(fileBuffer, fileName);
    const response = await imagekit.files.upload({
      file,
      fileName,
      folder,
    });
    return response.url || '';
  } catch (error) {
    logger.error('ImageKit upload failed:', error);
    throw error;
  }
};
