/**
 * Validador oficial de contraseñas para Consorcio Calle 425
 * Requisitos:
 * 1. Mínimo 6 caracteres
 * 2. Al menos una letra mayúscula (A-Z)
 * 3. Al menos una letra minúscula (a-z)
 * 4. Al menos un número (0-9)
 * 5. Al menos un carácter especial (!@#$%^&* etc.)
 */

export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  score: number; // 0 a 5
  errors: string[];
}

export function validatePasswordSecurity(password: string): PasswordValidationResult {
  const p = password || "";

  const hasMinLength = p.length >= 6;
  const hasUppercase = /[A-Z]/.test(p);
  const hasLowercase = /[a-z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`^]/.test(p);

  const errors: string[] = [];
  if (!hasMinLength) errors.push("Mínimo 6 caracteres");
  if (!hasUppercase) errors.push("Al menos una letra mayúscula (A-Z)");
  if (!hasLowercase) errors.push("Al menos una letra minúscula (a-z)");
  if (!hasNumber) errors.push("Al menos un número (0-9)");
  if (!hasSpecialChar) errors.push("Al menos un carácter especial (!@#$%...)");

  const score = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;

  return {
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    score,
    errors,
  };
}
