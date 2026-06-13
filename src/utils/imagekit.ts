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

/**
 * Deletes a file from ImageKit given its URL.
 */
export const deleteFromImageKit = async (url: string): Promise<void> => {
  if (!imagekit) {
    logger.warn('ImageKit is not configured. Skipping deletion.');
    return;
  }

  if (!url) {
    return;
  }

  // Check if the URL belongs to our ImageKit endpoint
  const urlEndpoint = ENV.IMAGEKIT_URL_ENDPOINT;
  if (!urlEndpoint || !url.startsWith(urlEndpoint)) {
    logger.debug(`URL ${url} is not an ImageKit URL or endpoint is not configured. Skipping deletion.`);
    return;
  }

  try {
    const cleanUrl = url.split('?')[0];
    const fileName = cleanUrl.split('/').pop();
    if (!fileName) {
      logger.warn(`Could not extract filename from URL: ${url}`);
      return;
    }

    logger.info(`Searching for file in ImageKit: ${fileName}`);
    // Search for the file to get the fileId
    const response = await imagekit.assets.list({
      searchQuery: `name = "${fileName}"`,
    });

    if (response && response.length > 0) {
      const file = response[0];
      if ('fileId' in file && file.fileId) {
        logger.info(`Deleting file from ImageKit: ${fileName} (${file.fileId})`);
        await imagekit.files.delete(file.fileId);
        logger.info(`Successfully deleted file from ImageKit: ${fileName}`);
      } else {
        logger.warn(`Found file but it had no fileId: ${fileName}`);
      }
    } else {
      logger.warn(`No file found in ImageKit with name: ${fileName}`);
    }
  } catch (error) {
    logger.error('Failed to delete file from ImageKit:', error);
  }
};

