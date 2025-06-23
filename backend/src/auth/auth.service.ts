// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

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

  async register(dto: CreateUserDto): Promise<{ user: User; token: string }> {
    const hashed = await bcrypt.hash(dto.password, 10);
    let newUser: User;
    try {
      newUser = await this.usersService.create({
        ...dto,
        password: hashed,
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
}
