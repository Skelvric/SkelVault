import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY!;

function getEncryptionKey() {
  return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
}

export function encryptPassword(password: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(password, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

export function decryptPassword(encryptedPassword: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  } catch (error) {
    console.error('🔐 [Crypto] 🔴 Unable to decrypt password:', error);
    throw new Error('🔴 Unable to decrypt password!');
  }
}
