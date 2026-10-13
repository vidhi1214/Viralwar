import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    
    let whereClause = "";
    const params: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    let paramCount = 0;

    if (username) {
      paramCount++;
      whereClause += ` AND "username" = $${paramCount}`;
      params.push(username);
    }

    const finalQuery = `
      SELECT u.*, cp.* 
      FROM "user" u
      JOIN "creator_profile" cp ON u."id" = cp."userId"
      WHERE 1=1 ${whereClause}
    `;

    const result = await query(finalQuery, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Creators fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, displayName, bio } = body;

    if (!email || !username) {
      return NextResponse.json(
        { error: "Email and username are required" },
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

    // Create user
    const userResult = await query(
      `INSERT INTO "user" (id, email, password, role, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        crypto.randomUUID(),
        email,
        "$2b$12$LqV3qGwGzKk7QwRtU4x5yS5pN6oM8rT1uV3wX5yZ7aB9cD2eF4gH6iJ8kL5mN7o", // placeholder hash
        "CREATOR",
        "ACTIVE",
      ]
    );

    // Create creator profile
    await query(
      `INSERT INTO "creator_profile" (id, userId, username, displayName) 
       VALUES ($1, $2, $3, $4)`,
      [
        userResult.rows[0].id,
        userResult.rows[0].id,
        username,
        displayName || username,
      ]
    );

    return NextResponse.json(userResult.rows[0], { status: 201 });
  } catch (error) {
    console.error("Creator signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}