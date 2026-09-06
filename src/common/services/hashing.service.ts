import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashingService {

    async hash(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    async compare(password: string, hashedPassword: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            
            if (error instanceof Error) {
                throw new Error(`Hashing comparison failed: ${error.message}`);
            }
            throw new Error('An unknown error occurred during password comparison');
        }
    }

}
