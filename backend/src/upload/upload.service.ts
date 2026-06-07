import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private configured = false;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.configured = true;
      this.logger.log('Cloudinary configured');
    } else {
      this.logger.warn('Cloudinary not configured - uploads will fail');
    }
  }

  /**
   * Upload un fichier image vers Cloudinary
   * Accepte un buffer (fichier uploadé via multer)
   */
  async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    if (!this.configured) {
      throw new BadRequestException('Service d\'upload non configuré. Contactez l\'administrateur.');
    }

    if (!file || !file.buffer) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.');
    }

    // Vérifier la taille (max 5 Mo)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image trop lourde. Maximum 5 Mo.');
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'agrib2b/products',
          transformation: [
            { width: 800, height: 800, crop: 'limit', quality: 'auto' },
          ],
          format: 'webp',
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload error: ${error.message}`);
            reject(new BadRequestException('Erreur lors de l\'upload de l\'image'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        },
      ).end(file.buffer);
    });
  }

  /**
   * Upload plusieurs images
   */
  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const result = await this.uploadImage(file);
      urls.push(result.url);
    }
    return urls;
  }

  /**
   * Supprimer une image de Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    if (!this.configured) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      this.logger.warn(`Failed to delete image ${publicId}`);
    }
  }
}
