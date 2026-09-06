import { Inject, Injectable } from "@nestjs/common";
import { v2 as Cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary'
import { error } from "console";
import * as streamifier from "streamifier";
import { UploadOptions } from "../../interfaces/upload-options.interface";
import { CLOUDINARY } from "./cloudinary.provider";

@Injectable()
export class CloudinaryService {
    constructor(
        @Inject(CLOUDINARY)
        private readonly cloudinary: typeof Cloudinary,
    ) { }

    upload(file: Express.Multer.File, options: UploadOptions): Promise<UploadApiResponse> {
        console.log(`uploading....`)
        return new Promise((resolve, reject) => {
            const stream = this.cloudinary.uploader.upload_stream(
                {
                    folder: options.folder,
                    resource_type: options.resourceType ?? 'image',
                    overwrite: options.overwrite ?? false,
                    public_id: options.fileName,
                },
                (
                    error: UploadApiErrorResponse | undefined,
                    result: UploadApiResponse | undefined,
                ) => {
                    if (error) {
                        console.log(`upload failed!`)
                        return reject(error);
                    }

                    if (!result) {
                        return reject(new Error('Cloudinary returned no result.'));
                    }
                    console.log(`upload successed`)
                    resolve(result);
                },
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
        })
    }

    async delete(storageKey: string): Promise<void> {
        await this.cloudinary.uploader.destroy(storageKey);
    }
}