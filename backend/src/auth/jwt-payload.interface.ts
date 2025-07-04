import { UserRole } from 'src/common/enums/user.enum';

export interface JwtPayload {
  sub: number; // User ID
  role: UserRole;
  email?: string;
  iat?: number; // Issued at
  exp?: number; // Expires at
}
