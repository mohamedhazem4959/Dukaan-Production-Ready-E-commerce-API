import { FileTypeValidator, Injectable, MaxFileSizeValidator, ParseFilePipe } from "@nestjs/common";

@Injectable()
export class ImageUploadPipe extends ParseFilePipe {
    constructor() {
        super({
            validators: [
                new MaxFileSizeValidator({
                    maxSize: 5 * 1024 * 1024,
                }),
                new FileTypeValidator({
                    fileType: /(jpg|jpeg|png|webp)$/i,
                }),
            ],
        });
    }
}