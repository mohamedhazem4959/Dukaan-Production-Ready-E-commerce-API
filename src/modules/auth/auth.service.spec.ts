import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma.service';
import { HashingService } from 'src/common/services/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/common/services/redis.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService - signUp', () => {
  let service: AuthService;
  let prismaMock: any;
  let hashServiceMock: any;
  let redisServiceMock: any;
  let mailServiceMock: any;
  let configServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
    };

    hashServiceMock = {
      hash: jest.fn().mockResolvedValue('hashed_password_123'),
      compare: jest.fn(),
    };

    redisServiceMock = {
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn(),
    };

    mailServiceMock = {
      sendVerifyEmail: jest.fn().mockResolvedValue({ message: 'Email sent' }),
    };

    configServiceMock = {
      get: jest.fn().mockReturnValue('http://localhost:3000/api/v1/auth/verify'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: HashingService, useValue: hashServiceMock },
        { provide: JwtService, useValue: {} },
        { provide: MailService, useValue: mailServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: RedisService, useValue: redisServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should successfully register a temporary user and send verification email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const createUserDto = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'SecretPassword123!',
      confirm_password: 'SecretPassword123!',
      birth_date: '1995-05-15',
      phone_number: '1234567890',
    };

    const result = await service.signUp(createUserDto);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'john@example.com' },
    });
    expect(hashServiceMock.hash).toHaveBeenCalledWith('SecretPassword123!');
    expect(redisServiceMock.setex).toHaveBeenCalledWith(
      'tempUser:john@example.com',
      expect.any(String),
      15 * 60,
    );
    expect(mailServiceMock.sendVerifyEmail).toHaveBeenCalledWith(
      'john@example.com',
      'john_doe',
      'http://localhost:3000/api/v1/auth/verify?email=john@example.com',
    );
    expect(result).toEqual({ message: 'Email sent' });
  });

  it('should throw UnauthorizedException if user email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, email: 'john@example.com' });

    const createUserDto = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'SecretPassword123!',
      confirm_password: 'SecretPassword123!',
      birth_date: '1995-05-15',
    };

    await expect(service.signUp(createUserDto)).rejects.toThrow(UnauthorizedException);
  });
});
