import { cookies } from "next/headers";
import { prisma } from "./prisma";
import crypto from "crypto";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  return secret;
}

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + getJwtSecret())
    .digest("hex");
}

function createToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + 24 * 60 * 60 * 1000 })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token: string): { userId: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = crypto
    .createHmac("sha256", getJwtSecret())
    .update(payload)
    .digest("base64url");
  if (signature !== expected) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (data.exp < Date.now()) return null;
  return { userId: data.userId };
}

export async function login(
  email: string,
  password: string
): Promise<string | null> {
  const user = await prisma.utilisateur.findUnique({ where: { email } });
  if (!user) return null;
  if (user.passwordHash !== hashPassword(password)) return null;
  return createToken(user.id);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const user = await prisma.utilisateur.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, nom: true, role: true },
  });
  return user;
}

export { hashPassword, createToken };
