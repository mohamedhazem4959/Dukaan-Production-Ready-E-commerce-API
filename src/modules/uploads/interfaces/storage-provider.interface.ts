import { UploadOptions } from './upload-options.interface';
import { UploadedFile } from './uploaded-file.interface';

export interface IStorageProvider {
  upload(file: Express.Multer.File, options: UploadOptions): Promise<UploadedFile>;

  uploadMany(files: Express.Multer.File[], options: UploadOptions): Promise<UploadedFile[]>;

  delete(fileId: string): Promise<void>;
}