import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  verifyPassword,
  createSession,
  getSessionCookieName,
  getSessionCookieMaxAge,
  findUserByEmail,
  createUser,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    let user: { id: string; email: string };

    if (existing) {
      if (!existing.password_hash) {
        return NextResponse.json(
          { error: "Account exists with different sign-in method" },
          { status: 400 }
        );
      }
      const ok = await verifyPassword(password, existing.password_hash);
      if (!ok) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }
      user = { id: existing.id, email: existing.email };
    } else {
      const passwordHash = await hashPassword(password);
      const newUser = await createUser(email, passwordHash);
      user = { id: newUser.id, email: newUser.email };
    }

    const token = await createSession(user);
    const cookieName = getSessionCookieName();
    const maxAge = getSessionCookieMaxAge();
    const response = NextResponse.json({ user });
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });
    return response;
  } catch (e) {
    if (e instanceof Error && e.message.includes("AUTH_SECRET")) {
      return NextResponse.json(
        { error: "Server auth not configured" },
        { status: 500 }
      );
    }
    throw e;
  }
}
