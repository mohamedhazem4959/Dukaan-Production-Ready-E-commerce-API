import { StorageProvider } from "../../../generated/prisma/enums";

export interface UploadedFile {
  storageKey: string;
  provider: StorageProvider;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}