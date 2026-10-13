import { Pool, QueryResult } from "pg";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "viralwar-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface User {
  id: string;
  email: string;
  role: "CREATOR" | "BRAND" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserWithoutId {
  email: string;
  role: "CREATOR" | "BRAND" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost/viralwar",
});

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function signToken(user: UserWithoutId): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: "CREATOR" | "BRAND" | "ADMIN"; status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" };
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      status: decoded.status,
    };
  } catch (error) {
    return null;
  }
}

export async function authenticateWithPassword(
  email: string,
  password: string
): Promise<AuthResponse | null> {
  const result = await query(
    `SELECT id, email, password, role, status FROM "user" WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  const passwordValid = await verifyPassword(password, user.password);

  if (!passwordValid) {
    return null;
  }

  if (user.status !== "ACTIVE") {
    return null;
  }

  const token = signToken({
    email: user.email,
    role: user.role,
    status: user.status,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    token,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await query(
    `SELECT id, email, role, status FROM "user" WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

// eslint-disable-line @typescript-eslint/no-explicit-any
export async function beginTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
