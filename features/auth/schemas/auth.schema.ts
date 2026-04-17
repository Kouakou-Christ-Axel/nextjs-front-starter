import z from 'zod';

// Unicode letters, spaces, apostrophes, hyphens. Used for human names.
const nameRegex = /^[\p{L}\s'-]+$/u;

// Email: trim + lowercase + RFC 5321 upper bound (254 chars)
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'emailInvalid' }))
  .pipe(z.string().max(254, { message: 'emailInvalid' }));

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(8, { message: 'passwordMinLength' })
    .max(128, { message: 'passwordMinLength' }),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

// Name field factory so firstName/lastName share the same rules
// with their own i18n keys.
const nameField = (minKey: string, invalidKey: string) =>
  z
    .string()
    .trim()
    .min(2, { message: minKey })
    .max(50, { message: invalidKey })
    .regex(nameRegex, { message: invalidKey });

export const registerSchema = loginSchema
  .extend({
    firstName: nameField('firstNameMinLength', 'firstNameInvalid'),
    lastName: nameField('lastNameMinLength', 'lastNameInvalid'),
    password: z
      .string()
      .min(12, { message: 'passwordMinLength' })
      .max(128, { message: 'passwordMinLength' })
      .regex(/[A-Z]/, { message: 'passwordUpper' })
      .regex(/[a-z]/, { message: 'passwordLower' })
      .regex(/[0-9]/, { message: 'passwordDigit' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

export type RegisterSchemaType = z.infer<typeof registerSchema>;
