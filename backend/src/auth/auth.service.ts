// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '../users/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { UserRole, UserStatus } from 'src/common/enums/user.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      user.password = '';
      return user;
    }
    return null;
  }

  async login(user: User): Promise<{ token: string }> {
    const payload = { sub: user.id, role: user.role };
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
    const payload = { sub: guestUser.id, role: guestUser.role };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '30m',
    }); // Shorter session for guests

    return { user: guestUser, token };
  }

  async register(dto: CreateUserDto): Promise<{ user: User; token: string }> {
    const hashed = await bcrypt.hash(dto.password, 10);
    let newUser: User;
    try {
      newUser = await this.usersService.create({
        ...dto,
        password: hashed,
        isGuest: false, // Explicitly set as non-guest
      });
    } catch (err: any) {
      // Postgres unique‐violation code
      if (err.code === '23505') {
        // email already exists
        throw new ConflictException('Email is already registered');
      }
      // something else went wrong
      throw new InternalServerErrorException();
    }
    newUser.password = '';

    // generate a token right away
    const payload = { sub: newUser.id, role: newUser.role };
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
    const payload = { sub: updatedUser.id, role: updatedUser.role };
    const token = await this.jwtService.signAsync(payload);

    return { user: updatedUser, token };
  }
}
