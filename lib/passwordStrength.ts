export type StrengthLevel = 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';

export interface PasswordStrength {
  score: number;
  level: StrengthLevel;
  label: string;
  warnings: string[];
}

const COMMON_PATTERNS = [
  /password/i,
  /qwerty/i,
  /123456/,
  /letmein/i,
  /admin/i,
  /welcome/i,
  /abc123/i,
];

export function estimatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, level: 'very-weak', label: 'Empty', warnings: [] };
  }

  const warnings: string[] = [];
  let score = 0;

  const length = password.length;
  if (length >= 8) score++;
  if (length >= 12) score++;
  if (length >= 16) score++;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const varietyCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  if (varietyCount >= 3) score++;
  if (varietyCount === 4) score++;

  if (length < 8) warnings.push('Too short — use at least 8 characters.');
  if (!hasUpper || !hasLower) warnings.push('Mix uppercase and lowercase letters.');
  if (!hasDigit) warnings.push('Add at least one number.');
  if (!hasSymbol) warnings.push('Add a symbol like !, #, or %.');

  const isCommon = COMMON_PATTERNS.some((pattern) => pattern.test(password));
  if (isCommon) {
    warnings.push('This looks like a common or guessable password.');
    score = Math.min(score, 1);
  }

  const hasRepeats = /(.)\1{2,}/.test(password);
  if (hasRepeats) {
    warnings.push('Avoid repeating the same character multiple times.');
    score = Math.max(0, score - 1);
  }

  score = Math.max(0, Math.min(4, score));

  const levels: { level: StrengthLevel; label: string }[] = [
    { level: 'very-weak', label: 'Very Weak' },
    { level: 'weak', label: 'Weak' },
    { level: 'fair', label: 'Fair' },
    { level: 'strong', label: 'Strong' },
    { level: 'very-strong', label: 'Very Strong' },
  ];

  return { score, ...levels[score], warnings };
}

export function isWeakPassword(password: string): boolean {
  if (!password) return true;
  const { score } = estimatePasswordStrength(password);
  return score <= 1 || password.length < 10 || COMMON_PATTERNS.some((p) => p.test(password));
}
