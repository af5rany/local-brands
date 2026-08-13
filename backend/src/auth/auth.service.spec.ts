// jwks-rsa depends on jose (ESM) — mock at module level for unit tests
jest.mock('jwks-rsa', () => {
  const fn = jest.fn().mockReturnValue({
    getSigningKey: jest.fn().mockResolvedValue({ getPublicKey: () => 'mock-public-key' }),
  });
  return fn;
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../common/mail/mail.service';
import { SocialAuth } from './social-auth.entity';
import { UserRole, UserStatus } from '../common/enums/user.enum';
import * as bcrypt from 'bcrypt';

const mockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password: '$2b$10$hashedpassword',
  role: UserRole.CUSTOMER,
  isGuest: false,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;
  let socialAuthRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    socialAuthRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findByResetToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('mock-token') },
        },
        {
          provide: MailService,
          useValue: {
            sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: getRepositoryToken(SocialAuth), useValue: socialAuthRepo },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  describe('validateUser', () => {
    it('returns user with cleared password when credentials valid', async () => {
      const user = mockUser({ password: await bcrypt.hash('pass123', 10) });
      usersService.findByEmail.mockResolvedValue(user as any);

      const result = await service.validateUser('test@example.com', 'pass123');
      expect(result).not.toBeNull();
      expect(result!.password).toBe('');
    });

    it('returns null when password wrong', async () => {
      const user = mockUser({ password: await bcrypt.hash('correct', 10) });
      usersService.findByEmail.mockResolvedValue(user as any);

      const result = await service.validateUser('test@example.com', 'wrong');
      expect(result).toBeNull();
    });

    it('returns null when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const result = await service.validateUser('nobody@example.com', 'pass');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('returns token for valid user', async () => {
      const user = mockUser() as any;
      const result = await service.login(user);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        id: user.id,
        role: user.role,
        isGuest: user.isGuest,
      });
      expect(result.token).toBe('mock-token');
    });
  });

  describe('register', () => {
    it('registers CUSTOMER and sends welcome email', async () => {
      const newUser = mockUser({ password: '' });
      usersService.create.mockResolvedValue(newUser as any);

      const result = await service.register({
        name: 'Test User',
        email: '  Test@Example.COM  ',
        password: 'pass123',
        role: UserRole.CUSTOMER,
        status: UserStatus.APPROVED,
      } as any);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com', isGuest: false }),
      );
      expect(mailService.sendWelcomeEmail).toHaveBeenCalled();
      expect(result.token).toBe('mock-token');
    });

    it('throws ForbiddenException when registering as ADMIN', async () => {
      await expect(
        service.register({
          name: 'Hacker',
          email: 'hacker@x.com',
          password: 'pass',
          role: UserRole.ADMIN,
          status: UserStatus.APPROVED,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when registering as BRAND_OWNER', async () => {
      await expect(
        service.register({
          name: 'Owner',
          email: 'owner@x.com',
          password: 'pass',
          role: UserRole.BRAND_OWNER,
          status: UserStatus.APPROVED,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException on duplicate email (Postgres code 23505)', async () => {
      usersService.create.mockRejectedValue({ code: '23505' });

      await expect(
        service.register({
          name: 'Dup',
          email: 'dup@example.com',
          password: 'pass',
          role: UserRole.CUSTOMER,
          status: UserStatus.APPROVED,
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('loginAsGuest', () => {
    it('creates guest user and returns short-lived token', async () => {
      const guestUser = mockUser({ isGuest: true, role: UserRole.GUEST, password: '' });
      usersService.create.mockResolvedValue(guestUser as any);

      const result = await service.loginAsGuest();

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ isGuest: true, role: UserRole.GUEST }),
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ isGuest: true }),
        expect.objectContaining({ expiresIn: '30m' }),
      );
      expect(result.token).toBe('mock-token');
    });
  });

  describe('convertGuestToUser', () => {
    it('throws ForbiddenException if account already converted', async () => {
      usersService.findById.mockResolvedValue(mockUser({ isGuest: false }) as any);

      await expect(
        service.convertGuestToUser(1, {
          name: 'Real',
          email: 'real@x.com',
          password: 'pass',
          role: UserRole.CUSTOMER,
          status: UserStatus.APPROVED,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when target email taken by another user', async () => {
      const guestUser = mockUser({ isGuest: true, id: 1 });
      const otherUser = mockUser({ isGuest: false, id: 99, email: 'taken@x.com' });
      usersService.findById.mockResolvedValue(guestUser as any);
      usersService.findByEmail.mockResolvedValue(otherUser as any);

      await expect(
        service.convertGuestToUser(1, {
          name: 'Real',
          email: 'taken@x.com',
          password: 'pass',
          role: UserRole.CUSTOMER,
          status: UserStatus.APPROVED,
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('forgotPassword', () => {
    it('returns generic message even when user not found (security)', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const result = await service.forgotPassword('nobody@x.com');
      expect(result.message).toMatch(/If an account/);
    });
  });
});
