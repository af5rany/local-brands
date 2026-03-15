import { UserRole } from 'src/common/enums/user.enum';

export interface JwtPayload {
  id: number;
  role: UserRole;
  isGuest: boolean;
  iat?: number;
  exp?: number;
}
