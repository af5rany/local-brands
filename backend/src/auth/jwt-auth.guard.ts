import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { User } from 'src/users/user.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = User>(err: any, user: any, info: any): TUser {
    if (err || !user) {
      console.log('JWT Auth Error:', err);
      console.log('JWT Info:', info);

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
