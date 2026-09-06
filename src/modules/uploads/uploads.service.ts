import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER } from './constants/storage.constants';
import { type IStorageProvider } from './interfaces/storage-provider.interface';
import { UploadOptions } from './interfaces/upload-options.interface';

@Injectable()
export class UploadsService {

    constructor(
        @Inject(STORAGE_PROVIDER)
        private readonly storage: IStorageProvider
    ){}

    upload(file: Express.Multer.File, options: UploadOptions){
        return this.storage.upload(file, options);
    }

    uploadMany(files: Express.Multer.File[], options: UploadOptions){
        return this.storage.uploadMany(files, options);
    }

    delete(fileId: string){
        return this.storage.delete(fileId);
    }

}
