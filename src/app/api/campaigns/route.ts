import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const brandId = searchParams.get("brandId");
    
    let whereClause = "";
    const params: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    let paramCount = 0;

    if (brandId) {
      paramCount++;
      whereClause += ` AND "brandId" = $${paramCount}`;
      params.push(brandId);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND "status" = $${paramCount}`;
      params.push(status);
    }

    if (platform) {
      paramCount++;
      whereClause += ` AND platform = $${paramCount}`;
      params.push(platform);
    }

    const finalQuery = `
      SELECT c.*, u.email as brandEmail, 
             COUNT(DISTINCT cp.id) as participantsCount,
             COUNT(DISTINCT s.id) as submissionsCount
      FROM "campaign" c
      JOIN "brand" b ON c."brandId" = b."id"
      JOIN "user" u ON b."id" = u."id"
      LEFT JOIN "campaign_participant" cp ON c."id" = cp."campaignId" AND cp.status = 'ACTIVE'
      LEFT JOIN "submission" s ON c."id" = s."campaignId" AND s.status = 'APPROVED'
      WHERE 1=1 ${whereClause}
      GROUP BY c."id", u.email
      ORDER BY c."createdAt" DESC
    `;

    const result = await query(finalQuery, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Campaigns fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      brandId,
      title,
      slug,
      description,
      product,
      objective,
      startAt,
      endAt,
      budget,
      prizePool,
      currency,
      rules,
      eligibility,
      platforms,
    } = body;

    // Validation
    if (!brandId || !title || !slug) {
      return NextResponse.json(
        { error: "Missing required fields: brandId, title, slug" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO "campaign" ("id", "brandId", "title", "slug", "description", "product", "objective", "startAt", "endAt", "budget", "prizePool", "currency", "rules", "eligibility", "platforms", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'DRAFT', $16, $17)
       RETURNING *`,
      [
        crypto.randomUUID(),
        brandId,
        title,
        slug,
        description || "",
        product || "",
        objective || "",
        startAt || null,
        endAt || null,
        budget || 0,
        prizePool || 0,
        currency || "INR",
        rules || null,
        eligibility || null,
        platforms || [],
        new Date(),
        new Date(),
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Campaign creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}