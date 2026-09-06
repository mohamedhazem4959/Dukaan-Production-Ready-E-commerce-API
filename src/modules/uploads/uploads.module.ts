import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { CloudinaryModule } from './storage/cloudinary/cloudinary.module';
import { STORAGE_PROVIDER } from './constants/storage.constants';
import { CloudinaryStorage } from './storage/cloudinary/cloudinary.storage';

@Module({
  imports: [CloudinaryModule],

  controllers: [UploadsController],

  providers: [
    UploadsService,

    {
      provide: STORAGE_PROVIDER,
      useExisting: CloudinaryStorage
    },
  ],

  exports: [UploadsService]
})
export class UploadsModule { }
