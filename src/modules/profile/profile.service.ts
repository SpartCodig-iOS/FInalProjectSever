import { Injectable } from '@nestjs/common';
import { getPool } from '../../db/pool';
import { UpdateProfileInput } from '../../validators/profileSchemas';
import { UserRecord } from '../../types/user';

@Injectable()
export class ProfileService {
  async updateProfile(userId: string, payload: UpdateProfileInput): Promise<UserRecord> {
    const pool = await getPool();
    const result = await pool.query(
      `UPDATE profiles
       SET
         name = COALESCE($2, name),
         avatar_url = COALESCE($3, avatar_url),
         updated_at = NOW()
       WHERE id = $1
       RETURNING
         id::text,
         email,
         name,
         avatar_url,
         username,
         created_at,
         updated_at`,
      [userId, payload.name ?? null, payload.avatarURL ?? null],
    );
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatar_url: row.avatar_url,
      username: row.username,
      created_at: row.created_at,
      updated_at: row.updated_at,
      password_hash: '',
    };
  }
}
