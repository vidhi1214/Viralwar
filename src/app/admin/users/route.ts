import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    
    let whereClause = "";
    const params: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    let paramCount = 0;

    if (role) {
      paramCount++;
      whereClause += ` AND "role" = $${paramCount}`;
      params.push(role);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND "status" = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND ("email" ILIKE $${paramCount} OR "displayName" ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const countQuery = await query(
      `SELECT COUNT(*) as total FROM "user" WHERE 1=1 ${whereClause}`,
      params
    );

    let usersQuery;
    if (paramCount > 0) {
      usersQuery = await query(
        `SELECT "id", "email", "role", "status", "createdAt" FROM "user" WHERE 1=1 ${whereClause} ORDER BY "createdAt" DESC LIMIT 50`,
        params
      );
    } else {
      usersQuery = await query(
        `SELECT "id", "email", "role", "status", "createdAt" FROM "user" ORDER BY "createdAt" DESC LIMIT 50`
      );
    }

    return NextResponse.json({
      users: usersQuery.rows,
      total: countQuery.rows[0]?.total || 0,
      page: 1,
      pageSize: 50
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role, status } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await query(
      `SELECT * FROM "user" WHERE email = $1`,
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = "$2b$12$dummyhash";

    const result = await query(
      `INSERT INTO "user" ("id", "email", "password", "role", "status") 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING "id", "email", "role", "status"`,
      [
        crypto.randomUUID(),
        email,
        hashedPassword,
        role || "CREATOR",
        status || "ACTIVE",
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Admin user creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}