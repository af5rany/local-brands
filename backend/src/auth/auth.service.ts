// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '../users/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { UserRole, UserStatus } from 'src/common/enums/user.enum';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/common/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) { }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      user.password = '';
      return user;
    }
    return null;
  }

  async login(user: User): Promise<{ token: string }> {
    const payload = { userId: user.id, role: user.role };
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
      status: UserStatus.APPROVED, // Auto-approve guests
      isGuest: true,
    });

    // Remove password from response
    guestUser.password = '';

    // Generate token with shorter expiration for guests
    const payload = { userId: guestUser.id, role: guestUser.role };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '30m',
    }); // Shorter session for guests

    return { user: guestUser, token };
  }

  async register(dto: CreateUserDto): Promise<{ user: User; token: string }> {
    // Restrict public registration roles to CUSTOMER ONLY
    // NOTE: In production, this should be guarded or handled via a different internal endpoint.
    // For seeding purposes, we allow it if the email is our seed admin email.
    if (
      dto.role !== UserRole.CUSTOMER && dto.email !== 'admin@gmail.com'
    ) {
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
      throw new InternalServerErrorException(err.message || 'Internal server error during registration');
    }
    newUser.password = '';

    // generate a token right away
    const payload = { userId: newUser.id, role: newUser.role };
    const token = await this.jwtService.signAsync(payload);

    return { user: newUser, token };
  }

  // Optional: Convert guest to regular user
  async convertGuestToUser(
    guestId: number,
    userDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    const guestUser = await this.usersService.findById(guestId);

    if (!guestUser || !guestUser.isGuest) {
      throw new Error('Invalid guest user');
    }

    const hashedPassword = await bcrypt.hash(userDto.password, 10);

    const updatedUser = await this.usersService.update(guestId, {
      name: userDto.name,
      email: userDto.email,
      password: hashedPassword,
      role: userDto.role,
      status: UserStatus.PENDING,
      isGuest: false,
    });

    updatedUser.password = '';

    // Generate new token
    const payload = { userId: updatedUser.id, role: updatedUser.role };
    const token = await this.jwtService.signAsync(payload);

    return { user: updatedUser, token };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Return success even if user not found for security reasons
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiration

    await this.usersService.update(user.id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    await this.mailService.sendPasswordResetEmail(user.email, token);

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPass: string): Promise<{ message: string }> {
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
}
