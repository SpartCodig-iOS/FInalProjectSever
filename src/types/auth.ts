import { UserResponseDto } from './user';

export type LoginType = 'email' | 'username' | 'signup';

export interface AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  refreshExpiresAt: string;
}
