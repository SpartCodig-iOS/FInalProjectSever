"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpenseSchema = void 0;
const zod_1 = require("zod");
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
exports.createExpenseSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(120),
    note: zod_1.z.string().max(500).optional(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().length(3, 'currency 는 3자리 통화 코드여야 합니다.').transform((val) => val.toUpperCase()),
    expenseDate: zod_1.z
        .string()
        .regex(isoDatePattern, 'expenseDate 는 YYYY-MM-DD 형식이어야 합니다.'),
    category: zod_1.z.string().min(1).max(50).optional(),
    payerId: zod_1.z.string().uuid().optional(),
    participantIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
