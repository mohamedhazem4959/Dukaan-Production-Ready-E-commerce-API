import { z } from 'zod'
import { createZodDto } from 'nestjs-zod';

export const loginUserSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "password must be at least 6 characters"),
})

export class LoginUserDto extends createZodDto(loginUserSchema) {}