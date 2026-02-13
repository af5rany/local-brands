import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from './public.decorator';
import { User } from 'src/users/user.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (err) {
      if (isPublic) {
        return true;
      }
      throw err;
    }
  }

  handleRequest<TUser = User>(err: any, user: any, info: any): TUser {
    if (err || !user) {

      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }

      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }

      if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active yet');
      }

      if (info?.message === 'No auth token') {
        throw new UnauthorizedException('No authorization token provided');
      }

      throw new UnauthorizedException('Authentication failed');
    }

    return user as TUser;
  }
}
