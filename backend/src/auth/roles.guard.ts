// // src/auth/roles.guard.ts

// import {
//   Injectable,
//   CanActivate,
//   ExecutionContext,
//   ForbiddenException,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { UserRole } from 'src/common/enums/user.enum';
// import { ROLES_KEY } from './roles.decorator';

// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(private reflector: Reflector) {}

//   canActivate(context: ExecutionContext): boolean {
//     const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
//       ROLES_KEY,
//       [context.getHandler(), context.getClass()],
//     );

//     const { user } = context.switchToHttp().getRequest();
//     const routeParams = context.switchToHttp().getRequest().params;

//     if (!user) {
//       throw new ForbiddenException('User not authenticated');
//     }

//     // Allow self-access: if the user is trying to access their own data
//     if (routeParams.id && routeParams.id === String(user.userId)) {
//       return true;
//     }

//     // Proceed with role-based checks if it's not a self-access request
//     if (requiredRoles && requiredRoles.length) {
//       const hasRole = requiredRoles.some((role) => user.role === role);
//       if (!hasRole) {
//         throw new ForbiddenException(
//           `Access denied. Required roles: ${requiredRoles.join(', ')}`,
//         );
//       }
//     }

//     return true;
//   }
// }

// src/auth/roles.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserStatus } from '../common/enums/user.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No roles required
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check user status - Blocked or Inactive users cannot perform actions
    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException(`Access denied. Your account is ${user.status}.`);
    }

    console.log('User role:', user.role);
    console.log('Required roles:', requiredRoles);

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
