// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GuestAuthGuard } from './guest-auth.guard';
import { RegisteredUsersOnlyGuard } from './registered-users-only.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'local-brands',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RolesGuard,
    JwtAuthGuard,
    GuestAuthGuard,
    RegisteredUsersOnlyGuard,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    RolesGuard,
    JwtAuthGuard,
    GuestAuthGuard,
    RegisteredUsersOnlyGuard,
  ],
})
export class AuthModule {}
