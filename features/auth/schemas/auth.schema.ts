import z from 'zod';

export const loginSchema = z.object({
  email: z.email({
    message: 'emailInvalid',
  }),
  password: z.string().min(8, {
    message: 'passwordMinLength',
  }),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(8, {
      message: 'passwordMinLength',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

export type RegisterSchemaType = z.infer<typeof registerSchema>;
