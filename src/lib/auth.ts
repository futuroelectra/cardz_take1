/**
 * Auth helpers: bcrypt for password hashing. Use only on server (API routes).
 * Never log or return password hashes.
 */

import { hash, compare } from "bcryptjs";

const BCRYPT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hashStored: string): Promise<boolean> {
  return compare(password, hashStored);
}
