// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { SocialAuth, SocialProvider } from './social-auth.entity';
import { SocialLoginDto } from './dto/social-login.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import jwksRsa = require('jwks-rsa');
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { UserRole, UserStatus } from 'src/common/enums/user.enum';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/common/mail/mail.service';
import { JwtPayload } from './jwt-payload.interface';

const appleJwksClient = jwksRsa({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 10 * 60 * 1000,
});

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectRepository(SocialAuth)
    private socialAuthRepository: Repository<SocialAuth>,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (user && (await bcrypt.compare(pass, user.password))) {
      user.password = '';
      return user;
    }
    return null;
  }

  async login(user: User): Promise<{ token: string }> {
    const payload: JwtPayload = {
      id: user.id,
      role: user.role,
      isGuest: user.isGuest,
    };
    const token = await this.jwtService.signAsync(payload);
    return { token };
  }

  async loginAsGuest(): Promise<{ user: User; token: string }> {
    // Create a temporary guest user
    const guestId = uuidv4();
    const guestUser = await this.usersService.create({
      name: `Guest User ${guestId.slice(0, 8)}`,
      email: `guest_${guestId}@temp.local`,
      password: undefined, // No password for guest
      role: UserRole.GUEST,
      status: UserStatus.APPROVED,
      isGuest: true,
    });

    // Remove password from response
    guestUser.password = '';

    // Generate token with shorter expiration for guests
    const payload: JwtPayload = {
      id: guestUser.id,
      role: guestUser.role,
      isGuest: true,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '30m',
    }); // Shorter session for guests

    return { user: guestUser, token };
  }

  async register(dto: CreateUserDto): Promise<{ user: User; token: string }> {
    // Restrict public registration roles to CUSTOMER ONLY
    // NOTE: In production, this should be guarded or handled via a different internal endpoint.
    // For seeding purposes, we allow it if the email is our seed admin email.
    if (dto.role !== UserRole.CUSTOMER && dto.email !== 'admin@gmail.com') {
      if (dto.role === UserRole.ADMIN) {
        throw new ForbiddenException('Admin registration is not allowed');
      }
      if (dto.role === UserRole.BRAND_OWNER) {
        throw new ForbiddenException(
          'Brand Owner accounts must be created by an administrator',
        );
      }
      throw new ForbiddenException(
        `Registration as ${dto.role} is not allowed through this endpoint`,
      );
    }

    dto.email = dto.email.trim().toLowerCase();

    const hashed = await bcrypt.hash(dto.password, 10);
    let newUser: User;
    try {
      newUser = await this.usersService.create({
        ...dto,
        password: hashed,
        isGuest: false, // Explicitly set as non-guest
      });
    } catch (err: any) {
      console.error('Registration error details:', err);
      // Postgres unique‐violation code
      if (err.code === '23505') {
        // email already exists
        throw new ConflictException('Email or username is already registered');
      }
      // something else went wrong
      throw new InternalServerErrorException(
        err.message || 'Internal server error during registration',
      );
    }
    newUser.password = '';

    // generate a token right away
    const payload: JwtPayload = {
      id: newUser.id,
      role: newUser.role,
      isGuest: false,
    };
    const token = await this.jwtService.signAsync(payload);

    // Send welcome email (non-blocking)
    this.mailService
      .sendWelcomeEmail(newUser.email, newUser.name)
      .catch(() => {});

    return { user: newUser, token };
  }

  async convertGuestToUser(
    guestId: number,
    userDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    const guestUser = await this.usersService.findById(guestId);

    if (!guestUser) {
      throw new NotFoundException('Guest user not found');
    }
    if (!guestUser.isGuest) {
      throw new ForbiddenException('Account has already been converted');
    }

    const normalizedEmail = userDto.email.trim().toLowerCase();
    const existingByEmail = await this.usersService.findByEmail(normalizedEmail);
    if (existingByEmail && existingByEmail.id !== guestId) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(userDto.password, 10);

    const updatedUser = await this.usersService.update(guestId, {
      name: userDto.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.CUSTOMER,
      status: UserStatus.APPROVED,
      isGuest: false,
      isEmailVerified: false,
    });

    updatedUser.password = '';

    const payload: JwtPayload = {
      id: updatedUser.id,
      role: updatedUser.role,
      isGuest: false,
    };
    const token = await this.jwtService.signAsync(payload);

    this.mailService
      .sendWelcomeEmail(updatedUser.email, updatedUser.name)
      .catch(() => {});

    return { user: updatedUser, token };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Return success even if user not found for security reasons
      return {
        message:
          'If an account with that email exists, a reset link has been sent.',
      };
    }

    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiration

    await this.usersService.update(user.id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    await this.mailService.sendPasswordResetEmail(user.email, token);

    return {
      message:
        'If an account with that email exists, a reset link has been sent.',
    };
  }

  async resetPassword(
    token: string,
    newPass: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByResetToken(token);

    if (!user || user.resetPasswordExpires < new Date()) {
      throw new ConflictException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(newPass, 10);

    await this.usersService.update(user.id, {
      password: hashed,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });

    return { message: 'Password has been reset successfully' };
  }

  async socialLogin(dto: SocialLoginDto): Promise<{ token: string }> {
    const { provider } = dto;

    let providerProfile: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
      isEmailVerified: boolean;
    };

    if (provider === 'google') {
      if (!dto.token) throw new UnauthorizedException('Google token is required');
      const res = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${dto.token}` } },
      );
      if (!res.ok) throw new UnauthorizedException('Invalid Google token');
      const data: any = await res.json();
      if (!data.email)
        throw new UnauthorizedException('Google token missing email');
      providerProfile = {
        id: data.sub,
        email: data.email,
        name: data.name,
        avatar: data.picture,
        isEmailVerified: true,
      };

    } else if (provider === 'facebook') {
      if (!dto.token) throw new UnauthorizedException('Facebook token is required');
      const res = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${dto.token}`,
      );
      if (!res.ok) throw new UnauthorizedException('Invalid Facebook token');
      const data: any = await res.json();
      if (!data.email)
        throw new UnauthorizedException(
          'Facebook token missing email — ensure email permission is granted',
        );
      providerProfile = {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.picture?.data?.url,
        isEmailVerified: true,
      };

    } else {
      // Apple
      if (!dto.identityToken)
        throw new UnauthorizedException('Apple identityToken is required');

      const decoded = jwt.decode(dto.identityToken, { complete: true });
      if (!decoded || typeof decoded === 'string' || !decoded.header?.kid) {
        throw new UnauthorizedException('Invalid Apple identity token structure');
      }

      let applePayload: any;
      try {
        const signingKey = await appleJwksClient.getSigningKey(decoded.header.kid);
        const publicKey = signingKey.getPublicKey();
        applePayload = jwt.verify(dto.identityToken, publicKey, {
          algorithms: ['RS256'],
          issuer: 'https://appleid.apple.com',
          audience: 'com.fakharanii.localbrands',
        });
      } catch {
        throw new UnauthorizedException('Apple identity token verification failed');
      }

      const sub: string = applePayload.sub;
      // Email present in JWT on first sign-in; may be absent on repeat logins
      const email: string | null = applePayload.email ?? dto.email ?? null;

      // Build name from fullName only on first sign-in when Apple provides it
      let name = 'Apple User';
      if (dto.fullName?.givenName || dto.fullName?.familyName) {
        name = [dto.fullName.givenName, dto.fullName.familyName]
          .filter(Boolean)
          .join(' ');
      } else if (email) {
        name = email.split('@')[0];
      }

      // Relay/hidden emails (privaterelay.appleid.com) are valid — don't strip them
      const resolvedEmail = email ?? `apple_${sub}@privaterelay.local`;

      providerProfile = {
        id: sub,
        email: resolvedEmail,
        name,
        avatar: undefined,
        isEmailVerified: !!email,
      };
    }

    // Lookup existing linked social account
    const existing = await this.socialAuthRepository.findOne({
      where: {
        provider: provider as SocialProvider,
        providerId: providerProfile.id,
      },
      relations: ['user'],
    });

    let user: User | null = null;

    if (existing) {
      user = existing.user;
      // Persist name/email from Apple first-login if missing on the existing record
      if (provider === 'apple') {
        const updates: Partial<User> = {};
        if (!user.name || user.name === 'Apple User') updates.name = providerProfile.name;
        if (!user.email && providerProfile.email) updates.email = providerProfile.email;
        if (Object.keys(updates).length) await this.usersService.update(user.id, updates);
      }
    } else {
      user = await this.usersService.findByEmail(providerProfile.email);
      if (!user) {
        user = await this.usersService.create({
          name: providerProfile.name,
          email: providerProfile.email,
          avatar: providerProfile.avatar,
          role: UserRole.CUSTOMER,
          status: UserStatus.APPROVED,
          isGuest: false,
          isEmailVerified: providerProfile.isEmailVerified,
        });
      }
      const socialAuth = this.socialAuthRepository.create({
        provider: provider as SocialProvider,
        providerId: providerProfile.id,
        user,
        profile: {
          email: providerProfile.email,
          name: providerProfile.name,
          avatar: providerProfile.avatar,
        },
      });
      await this.socialAuthRepository.save(socialAuth);
    }

    const jwtPayload: JwtPayload = {
      id: user!.id,
      role: user!.role,
      isGuest: false,
    };
    const token = await this.jwtService.signAsync(jwtPayload);
    return { token };
  }
}
