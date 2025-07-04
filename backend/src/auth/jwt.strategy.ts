// jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload } from './jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { UserStatus } from 'src/common/enums/user.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'local-brands',
    });
  }

  async validate(payload: JwtPayload) {
    console.log('JWT Payload:', payload);

    // Get user from database to ensure they still exist and have current info
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is active (except for guests who might be approved)
    if (
      user.status !== UserStatus.APPROVED &&
      user.status !== UserStatus.PENDING
    ) {
      throw new UnauthorizedException('User account is not active');
    }

    // This will be available as req.user in your controllers
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isGuest: user.isGuest,
      status: user.status,
    };
  }
}
