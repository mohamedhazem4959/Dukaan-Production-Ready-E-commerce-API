import { Controller, FileTypeValidator, MaxFileSizeValidator, Param, ParseFilePipe, ParseIntPipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { ImageUploadPipe } from './image-upload.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
@Controller('uploads')
export class UploadsController {
    constructor(
        private readonly uploadsService: UploadsService,
    ) { }

    @Post()
    @UseInterceptors(
        FileInterceptor('image', {
            storage: memoryStorage(),
        }),
    )
    async upload(@UploadedFile(new ImageUploadPipe()) file: Express.Multer.File) {
        return this.uploadsService.upload(file, {
            folder: 'products',
        });
    }

    async delete(@Param('id') file_id: string) {
        return this.uploadsService.delete(file_id);
    }
}
