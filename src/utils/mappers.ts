import { User } from '@supabase/supabase-js';
import { UserRecord, UserResponseDto, UserProfileDto } from '../types/user';

export const toUserResponse = (user: UserRecord): UserResponseDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarURL: user.avatar_url,
  createdAt: user.created_at,
  userId: user.username,
});

export const toProfileResponse = (user: UserRecord): UserProfileDto => ({
  id: user.id,
  userId: user.username,
  email: user.email,
  name: user.name,
  avatarURL: user.avatar_url,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

export const fromSupabaseUser = (supabaseUser: User): UserRecord => ({
  id: supabaseUser.id,
  email: supabaseUser.email ?? '',
  name: (supabaseUser.user_metadata?.name as string | null) ?? null,
  avatar_url: (supabaseUser.user_metadata?.avatar_url as string | null) ?? null,
  username: supabaseUser.email?.split('@')[0] || supabaseUser.id,
  password_hash: '',
  created_at: supabaseUser.created_at ? new Date(supabaseUser.created_at) : null,
  updated_at: supabaseUser.updated_at ? new Date(supabaseUser.updated_at) : null,
});
