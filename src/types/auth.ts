import { UserResponseDto } from './user';

export type LoginType = 'email' | 'username' | 'signup' | 'apple';

export interface AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  refreshExpiresAt: string;
}
