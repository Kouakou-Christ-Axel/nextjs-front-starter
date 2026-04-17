import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from './auth.schema';

type IssueLike = { message: string; path: ReadonlyArray<PropertyKey> };

function getMessagesForPath(issues: ReadonlyArray<IssueLike>, path: string) {
  return issues
    .filter((i) => i.path.map(String).join('.') === path)
    .map((i) => i.message);
}

describe('loginSchema', () => {
  it('accepts a valid credentials pair', () => {
    const result = loginSchema.safeParse({
      email: 'a@b.co',
      password: '12345678',
    });
    expect(result.success).toBe(true);
  });

  it('trims and lowercases the email', () => {
    const result = loginSchema.safeParse({
      email: '  A@B.CO  ',
      password: '12345678',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('a@b.co');
    }
  });

  it('rejects emails longer than 254 chars', () => {
    // Build an email whose length exceeds 254 chars
    const longLocal = 'a'.repeat(250);
    const longEmail = `${longLocal}@b.co`; // 250 + 5 = 255 chars
    const result = loginSchema.safeParse({
      email: longEmail,
      password: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejects passwords longer than 128 chars', () => {
    const result = loginSchema.safeParse({
      email: 'a@b.co',
      password: 'a'.repeat(129),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format with emailInvalid key', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: '12345678',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getMessagesForPath(result.error.issues, 'email')).toContain(
        'emailInvalid'
      );
    }
  });

  it('rejects passwords shorter than 8 with passwordMinLength key', () => {
    const result = loginSchema.safeParse({
      email: 'a@b.co',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getMessagesForPath(result.error.issues, 'password')).toContain(
        'passwordMinLength'
      );
    }
  });
});

describe('registerSchema', () => {
  const validBase = {
    email: 'a@b.co',
    password: 'Abcd1234xyz!',
    confirmPassword: 'Abcd1234xyz!',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('accepts valid registration', () => {
    const result = registerSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('requires password min 12', () => {
    // 8 chars matches old min but should fail new min of 12
    const result = registerSchema.safeParse({
      ...validBase,
      password: 'Abcd123!',
      confirmPassword: 'Abcd123!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getMessagesForPath(result.error.issues, 'password')).toContain(
        'passwordMinLength'
      );
    }
  });

  it('requires uppercase in password with passwordUpper key', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      password: 'abcd1234xyz!',
      confirmPassword: 'abcd1234xyz!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getMessagesForPath(result.error.issues, 'password')).toContain(
        'passwordUpper'
      );
    }
  });

  it('requires lowercase in password with passwordLower key', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      password: 'ABCD1234XYZ!',
      confirmPassword: 'ABCD1234XYZ!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getMessagesForPath(result.error.issues, 'password')).toContain(
        'passwordLower'
      );
    }
  });

  it('requires digit in password with passwordDigit key', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      password: 'Abcdefghijkl',
      confirmPassword: 'Abcdefghijkl',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getMessagesForPath(result.error.issues, 'password')).toContain(
        'passwordDigit'
      );
    }
  });

  it('rejects password longer than 128', () => {
    const longPwd = `Aa1${'b'.repeat(130)}`;
    const result = registerSchema.safeParse({
      ...validBase,
      password: longPwd,
      confirmPassword: longPwd,
    });
    expect(result.success).toBe(false);
  });

  it('accepts Unicode names (é, ñ, apostrophes, hyphens)', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      firstName: 'Émilie',
      lastName: "O'Brien-López",
    });
    expect(result.success).toBe(true);
  });

  it('rejects firstName longer than 50 chars', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      firstName: 'A'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('rejects lastName longer than 50 chars', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      lastName: 'A'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('rejects firstName with digits using firstNameInvalid key', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      firstName: 'John123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getMessagesForPath(result.error.issues, 'firstName')).toContain(
        'firstNameInvalid'
      );
    }
  });

  it('rejects lastName with symbols using lastNameInvalid key', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      lastName: 'Doe@!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getMessagesForPath(result.error.issues, 'lastName')).toContain(
        'lastNameInvalid'
      );
    }
  });

  it('rejects firstName shorter than 2 with firstNameMinLength key', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      firstName: 'A',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getMessagesForPath(result.error.issues, 'firstName')).toContain(
        'firstNameMinLength'
      );
    }
  });

  it('rejects lastName shorter than 2 with lastNameMinLength key', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      lastName: 'D',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getMessagesForPath(result.error.issues, 'lastName')).toContain(
        'lastNameMinLength'
      );
    }
  });

  it('detects password mismatch', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      password: 'Abcd1234xyz!',
      confirmPassword: 'Different5678X!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        getMessagesForPath(result.error.issues, 'confirmPassword')
      ).toContain('passwordMismatch');
    }
  });

  it('trims and lowercases email during registration', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      email: '  USER@EXAMPLE.COM  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('trims whitespace around firstName and lastName', () => {
    const result = registerSchema.safeParse({
      ...validBase,
      firstName: '  John  ',
      lastName: '  Doe  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('John');
      expect(result.data.lastName).toBe('Doe');
    }
  });
});
