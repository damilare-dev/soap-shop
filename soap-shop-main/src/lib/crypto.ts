// Cryptographic utilities — PIN hashing using Web Crypto API (SHA-256 + app salt)
// No external dependencies required; works in all modern browsers.

const APP_SALT = 'soapstock-v1-salt';

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + APP_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPin(entered: string, storedHash: string): Promise<boolean> {
  const hash = await hashPin(entered);
  return hash === storedHash;
}
