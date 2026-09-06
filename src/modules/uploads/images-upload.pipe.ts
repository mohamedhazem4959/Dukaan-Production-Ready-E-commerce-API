import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { Express } from 'express';

@Injectable()
export class ImagesUploadPipe
  implements PipeTransform<Express.Multer.File[]>
{
  private static readonly MAX_FILES = 10;
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  transform(files: Express.Multer.File[]): Express.Multer.File[] {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'At least one image is required.',
      );
    }

    if (files.length > ImagesUploadPipe.MAX_FILES) {
      throw new BadRequestException(
        `Maximum ${ImagesUploadPipe.MAX_FILES} images are allowed.`,
      );
    }

    for (const file of files) {
      this.validate(file);
    }

    return files;
  }

  private validate(file: Express.Multer.File): void {
    if (
      !ImagesUploadPipe.ALLOWED_MIME_TYPES.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        `${file.originalname} is not a supported image format.`,
      );
    }

    if (file.size > ImagesUploadPipe.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `${file.originalname} exceeds the maximum allowed size of 5 MB.`,
      );
    }
  }
}