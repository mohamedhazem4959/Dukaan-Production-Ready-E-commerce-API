export interface UploadOptions {
  folder: string;

  isPublic?: boolean;

  overwrite?: boolean;

  fileName?: string;

  resourceType?: 'image' | 'video' | 'raw' | 'auto';

  isPrimary?: boolean
}