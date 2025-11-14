import { z } from 'zod';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const createExpenseSchema = z.object({
  title: z.string().min(1).max(120),
  note: z.string().max(500).optional(),
  amount: z.number().positive(),
  currency: z.string().length(3, 'currency 는 3자리 통화 코드여야 합니다.').transform((val) => val.toUpperCase()),
  expenseDate: z
    .string()
    .regex(isoDatePattern, 'expenseDate 는 YYYY-MM-DD 형식이어야 합니다.'),
  category: z.string().min(1).max(50).optional(),
  payerId: z.string().uuid().optional(),
  participantIds: z.array(z.string().uuid()).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
