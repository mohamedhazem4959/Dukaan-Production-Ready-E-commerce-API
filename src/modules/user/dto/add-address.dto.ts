import { createZodDto } from 'nestjs-zod';
import { zSafeString } from 'src/common/utils/zod.utils';
import { z } from 'zod';


export const addUserAddressSchema = z.object({
    city: zSafeString(z.string().min(3)),
    street: zSafeString(z.string().min(3)),
    bulding: zSafeString(z.string()),
    isDefault: z.boolean().optional(),
})

export class AddUserAddressDto extends createZodDto(addUserAddressSchema) {}