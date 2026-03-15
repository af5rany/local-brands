// src/auth/jwt-payload.interface.ts
import { JwtPayload as StandardJwtPayload } from "jwt-decode";

export interface JwtPayload extends StandardJwtPayload {
  // Your custom fields
  id: number; // user id field in the JWT token
  role: string; // role field in the JWT token
  isGuest: boolean; // guest flag in the JWT token
}
