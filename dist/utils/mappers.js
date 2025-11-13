"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromSupabaseUser = exports.toProfileResponse = exports.toUserResponse = void 0;
const toUserResponse = (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarURL: user.avatar_url,
    createdAt: user.created_at,
    userId: user.username,
});
exports.toUserResponse = toUserResponse;
const toProfileResponse = (user) => ({
    id: user.id,
    userId: user.username,
    email: user.email,
    name: user.name,
    avatarURL: user.avatar_url,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
});
exports.toProfileResponse = toProfileResponse;
const fromSupabaseUser = (supabaseUser) => ({
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name: supabaseUser.user_metadata?.name ?? null,
    avatar_url: supabaseUser.user_metadata?.avatar_url ?? null,
    username: supabaseUser.email?.split('@')[0] || supabaseUser.id,
    password_hash: '',
    created_at: supabaseUser.created_at ? new Date(supabaseUser.created_at) : null,
    updated_at: supabaseUser.updated_at ? new Date(supabaseUser.updated_at) : null,
});
exports.fromSupabaseUser = fromSupabaseUser;
