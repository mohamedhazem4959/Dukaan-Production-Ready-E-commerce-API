import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymobGateway } from './paymob.gateway';
import { PaymobProvider } from './paymob.provider';

@Module({
    imports: [ConfigModule],
    providers: [PaymobGateway, PaymobProvider],

    exports: [PaymobGateway]
})
export class PaymobModule { }
