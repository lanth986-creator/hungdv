import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export const hashPassword = async (password) => {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${key.toString('hex')}`;
};

export const verifyPassword = async (password, storedHash) => {
  const [algorithm, salt, keyHex] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !keyHex) {
    return false;
  }

  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scrypt(password, salt, expected.length);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
