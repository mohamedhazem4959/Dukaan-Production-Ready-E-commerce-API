import { Module } from "@nestjs/common";
import { CloudinaryProvider } from "./cloudinary.provider";
import { CloudinaryStorage } from "./cloudinary.storage";
import { CloudinaryService } from "./cloudinary.service";


@Module({
    providers:[
        CloudinaryProvider,
        CloudinaryStorage,
        CloudinaryService,
        
    ],
    exports: [CloudinaryStorage]
})
export class CloudinaryModule {}