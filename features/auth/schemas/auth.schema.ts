import z from 'zod';

const nameRegex = /^[\p{L}\s'-]+$/u;

const emailMessage = 'Adresse e-mail invalide';

// trim + lowercase + borne haute RFC 5321 (254 caractères)
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: emailMessage }))
  .pipe(z.string().max(254, { message: emailMessage }));

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    .max(128, {
      message: 'Le mot de passe ne doit pas dépasser 128 caractères',
    }),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(2, { message: `${label} doit contenir au moins 2 caractères` })
    .max(50, { message: `${label} ne doit pas dépasser 50 caractères` })
    .regex(nameRegex, {
      message: `${label} contient des caractères invalides`,
    });

export const registerSchema = loginSchema
  .extend({
    firstName: nameField('Le prénom'),
    lastName: nameField('Le nom'),
    password: z
      .string()
      .min(12, {
        message: 'Le mot de passe doit contenir au moins 12 caractères',
      })
      .max(128, {
        message: 'Le mot de passe ne doit pas dépasser 128 caractères',
      })
      .regex(/[A-Z]/, { message: 'Ajoutez au moins une majuscule' })
      .regex(/[a-z]/, { message: 'Ajoutez au moins une minuscule' })
      .regex(/[0-9]/, { message: 'Ajoutez au moins un chiffre' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type RegisterSchemaType = z.infer<typeof registerSchema>;
