import { z } from 'zod'
import { createZodDto } from 'nestjs-zod';
import { zSafeString } from '../../../common/utils/zod.utils';

export const createUserSchema = z.object({
    username: zSafeString(z.string().min(3, "username must be at least 3 characters").max(20, "username must not exceed 20 characters")),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "password must be at least 6 characters"),
    confirm_password: z.string().min(6, "password must be at least 6 characters"),
    birth_date: z.string().date("Invalid date format. Use YYYY-MM-DD"),
    phone_number: zSafeString(z.string()).optional()
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords dont match.",
    path: ["confirm_password"]
})

export class CreateUserDto extends createZodDto(createUserSchema) {}