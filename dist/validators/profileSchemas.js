"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120).nullable().optional(),
    avatarURL: zod_1.z.string().url().nullable().optional(),
});
