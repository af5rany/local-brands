import { UserRole } from 'src/common/enums/user.enum';

export interface JwtPayload {
  userId: number;
  role: UserRole;
  isGuest: boolean;
  iat?: number;
  exp?: number;
}
