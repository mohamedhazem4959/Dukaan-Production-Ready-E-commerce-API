import { ConfigService } from "@nestjs/config";
import { PAYMOB_CLIENT } from "./paymob.constants";
import { PaymobClient } from "./paymob.client";
import { RedisService } from "src/common/services/redis.service";

export const PaymobProvider = {
    provide: PAYMOB_CLIENT,

    useFactory: (configService: ConfigService, redisService: RedisService) => {
        return new PaymobClient(configService, redisService);
    },

    inject: [ConfigService, RedisService],
};