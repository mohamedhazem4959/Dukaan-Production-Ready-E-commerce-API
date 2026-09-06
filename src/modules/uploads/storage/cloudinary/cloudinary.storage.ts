import { Injectable } from "@nestjs/common";
import { CloudinaryService } from "./cloudinary.service";
import { StorageProvider } from "src/generated/prisma/enums";
import { IStorageProvider } from "src/modules/uploads/interfaces/storage-provider.interface";
import { UploadOptions } from "src/modules/uploads/interfaces/upload-options.interface";
import { UploadedFile } from "src/modules/uploads/interfaces/uploaded-file.interface";

@Injectable()
export class CloudinaryStorage implements IStorageProvider {
    constructor(
        private readonly cloudinary: CloudinaryService,
    ){}

    async upload(file: Express.Multer.File, options: UploadOptions): Promise<UploadedFile> {
        const result = await this.cloudinary.upload(file, options);

        return {
            storageKey: result.public_id,
            provider: StorageProvider.CLOUDINARY,
            url: result.secure_url,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: result.bytes,
        };
    }

    async uploadMany(files: Express.Multer.File[], options: UploadOptions): Promise<UploadedFile[]> {
        return Promise.all(files.map((file) => this.upload(file, options)));
    }

    async delete(storageKey: string): Promise<void> {
        await this.cloudinary.delete(storageKey);
    }
}