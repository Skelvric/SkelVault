import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const CURRENT_VERSION = 'v2';

let cachedKey: Buffer | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `🔐 [Crypto] 🔴 Missing required environment variable: ${name}. ` +
        `See .env.example for setup instructions.`
    );
  }
  return value;
}

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const secret = getRequiredEnv('ENCRYPTION_KEY');
  const saltB64 = getRequiredEnv('ENCRYPTION_SALT');

  let salt: Buffer;
  try {
    salt = Buffer.from(saltB64, 'base64');
  } catch {
    throw new Error('🔐 [Crypto] 🔴 ENCRYPTION_SALT must be valid base64.');
  }

  if (salt.length < 16) {
    throw new Error(
      '🔐 [Crypto] 🔴 ENCRYPTION_SALT is too short (need >= 16 random bytes, base64-encoded). ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(16).toString(\'base64\'))"'
    );
  }

  cachedKey = crypto.scryptSync(secret, salt, KEY_LENGTH);
  return cachedKey;
}

export function encryptPassword(password: string): string {
  if (typeof password !== 'string') {
    throw new Error('🔐 [Crypto] 🔴 encryptPassword expects a string.');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(password, 'utf-8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    CURRENT_VERSION,
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

export function decryptPassword(encryptedPassword: string): string {
  if (typeof encryptedPassword !== 'string' || !encryptedPassword.includes(':')) {
    throw new Error('🔐 [Crypto] 🔴 Malformed encrypted value.');
  }

  const parts = encryptedPassword.split(':');

  try {
    if (parts[0] === CURRENT_VERSION && parts.length === 4) {
      const [, ivHex, authTagHex, dataHex] = parts;
      const key = getEncryptionKey();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(dataHex, 'hex');

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted.toString('utf-8');
    }

    if (parts.length === 2) {
      return decryptLegacyCbc(parts[0], parts[1]);
    }

    throw new Error('Unrecognized ciphertext format.');
  } catch (error) {
    console.error('🔐 [Crypto] 🔴 Unable to decrypt value:', error);
    throw new Error(
      '🔴 Unable to decrypt this entry. It may be corrupted or was encrypted with a different key.'
    );
  }
}

function decryptLegacyCbc(ivHex: string, dataHex: string): string {
  const secret = getRequiredEnv('ENCRYPTION_KEY');
  const legacyKey = crypto.scryptSync(secret, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', legacyKey, iv);
  let decrypted = decipher.update(dataHex, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

export function isLegacyCiphertext(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 2;
}
