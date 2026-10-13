import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, username, displayName } = body;

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Email, password, and username are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query(
      `SELECT * FROM "user" WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userResult = await query(
      `INSERT INTO "user" (id, email, password, role, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, role, status`,
      [
        crypto.randomUUID(),
        email,
        hashedPassword,
        "CREATOR",
        "ACTIVE",
      ]
    );

    // Create creator profile
    await query(
      `INSERT INTO "creator_profile" (id, userId, username, displayName) 
       VALUES ($1, $2, $3, $5)`,
      [
        userResult.rows[0].id,
        userResult.rows[0].id,
        username,
        displayName || username,
      ]
    );

    return NextResponse.json({
      user: {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        role: userResult.rows[0].role,
        status: userResult.rows[0].status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Creator signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}