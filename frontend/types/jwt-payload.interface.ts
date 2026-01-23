// src/auth/jwt-payload.interface.ts
import { JwtPayload as StandardJwtPayload } from "jwt-decode";

export interface JwtPayload extends StandardJwtPayload {
  // Your custom fields
  userId: number; // userId field in the JWT token
  role: string; // role field in the JWT token
  email: string; // email field in the JWT token
}
