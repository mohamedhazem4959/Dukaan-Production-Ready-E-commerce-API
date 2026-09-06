import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let service: MailService;
  let mockMailerService: { sendMail: jest.Mock };

  beforeEach(async () => {
    mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call sendMail on sendVerifyEmail', () => {
    const res = service.sendVerifyEmail('test@example.com', 'Test User', 'http://example.com/verify');
    expect(res).toEqual({ success: true, message: 'Email sent successfully' });
    expect(mockMailerService.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Welcome to Our App!',
      template: './verify-email',
      context: {
        name: 'Test User',
        url: 'http://example.com/verify',
      },
    });
  });
});
