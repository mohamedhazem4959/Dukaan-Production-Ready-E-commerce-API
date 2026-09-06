import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService
    ) { }

    sendVerifyEmail(to: string, name: string, url: string) {
        try {
            this.mailerService.sendMail({
                to: to,
                subject: 'Welcome to Our App!',
                template: './verify-email', // Refers to verify-email.hbs inside templates folder
                context: {
                    name: name,
                    url: url
                },
            }).then(()=>{console.log(`sent email successfully`)});
            return { success: true, message: 'Email sent successfully' };
        } catch (error) {
            throw new Error(`${error}`)
        }
    }
}
