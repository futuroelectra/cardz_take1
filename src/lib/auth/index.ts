import { SignJWT, jwtVerify } from "jose";
import { compare, hash } from "bcryptjs";
import { getSql } from "@/lib/db";
import type { UserRow } from "@/lib/db";

const SECRET = process.env.AUTH_SECRET;
const COOKIE_NAME = "cardzzz_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  if (!SECRET || SECRET.length < 32)
    throw new Error("AUTH_SECRET must be set and at least 32 characters");
  return new TextEncoder().encode(SECRET);
}

export type SessionUser = { id: string; email: string };

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return compare(password, passwordHash);
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ id: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${MAX_AGE}s`)
    .setIssuedAt()
    .sign(getSecret());
  return token;
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export function getSessionCookieMaxAge(): number {
  return MAX_AGE;
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = payload.id as string;
    const email = payload.email as string;
    if (id && email) return { id, email };
  } catch {
    // invalid or expired
  }
  return null;
}

/**
 * Get the current user from the request's cookie. Use in API route handlers.
 * Returns null if no cookie, invalid, or AUTH_SECRET not set.
 */
export async function getCurrentUser(
  cookieHeader: string | null
): Promise<SessionUser | null> {
  if (!SECRET) return null;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`${COOKIE_NAME}=([^;]+)`, "i")
  );
  const token = match?.[1]?.trim();
  if (!token) return null;
  return verifySession(token);
}

/**
 * Find user by email. Returns null if not found.
 */
export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const sql = getSql();
  const rows = await sql`SELECT id, email, password_hash, created_at FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    password_hash: row.password_hash,
    created_at: row.created_at,
  } as UserRow;
}

/**
 * Create a new user with email and hashed password. Returns the new user.
 */
export async function createUser(
  email: string,
  passwordHash: string
): Promise<UserRow> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO users (email, password_hash)
    VALUES (${email.toLowerCase().trim()}, ${passwordHash})
    RETURNING id, email, password_hash, created_at
  `;
  const row = rows[0];
  if (!row) throw new Error("Failed to create user");
  return row as unknown as UserRow;
}
