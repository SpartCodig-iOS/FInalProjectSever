"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const pool_1 = require("../../db/pool");
let ProfileService = class ProfileService {
    async updateProfile(userId, payload) {
        const pool = await (0, pool_1.getPool)();
        const result = await pool.query(`UPDATE profiles
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
         updated_at`, [userId, payload.name ?? null, payload.avatarURL ?? null]);
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
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)()
], ProfileService);
