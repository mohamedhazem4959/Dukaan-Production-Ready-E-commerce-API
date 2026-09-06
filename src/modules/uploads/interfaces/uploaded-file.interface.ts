import { StorageProvider } from "src/generated/prisma/enums";

export interface UploadedFile {
  storageKey: string;
  provider: StorageProvider;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}