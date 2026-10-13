import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const creatorId = searchParams.get("creatorId");
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");
    
    let whereClause = "";
    const params: any[] = [];
    let paramCount = 0;

    if (campaignId) {
      paramCount++;
      whereClause += ` AND "campaignId" = $${paramCount}`;
      params.push(campaignId);
    }

    if (creatorId) {
      paramCount++;
      whereClause += ` AND "creatorId" = $${paramCount}`;
      params.push(creatorId);
    }

    if (platform) {
      paramCount++;
      whereClause += ` AND platform = $${paramCount}`;
      params.push(platform);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }

    const finalQuery = `
      SELECT s.*, u.email as creatorEmail, cp.status as participantStatus
      FROM "submission" s
      JOIN "creator_profile" u ON s."creatorId" = u."userId"
      LEFT JOIN "campaign_participant" cp ON s."campaignId" = cp."campaignId" AND s."creatorId" = cp."creatorId"
      WHERE 1=1 ${whereClause}
      ORDER BY s."submittedAt" DESC
    `;

    const result = await query(finalQuery, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Submissions fetch error:", error);
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
      campaignId,
      creatorId,
      platform,
      contentUrl,
      caption,
    } = body;

    // Validation
    if (!campaignId || !creatorId || !platform || !contentUrl) {
      return NextResponse.json(
        { error: "Missing required fields: campaignId, creatorId, platform, contentUrl" },
        { status: 400 }
      );
    }

    // Check campaign exists and is active
    const campaignCheck = await query(
      `SELECT * FROM "campaign" WHERE "id" = $1 AND "status" = 'ACTIVE'`,
      [campaignId]
    );

    if (campaignCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Campaign not found or not active" },
        { status: 404 }
      );
    }

    // Check if creator is participating in the campaign
    const participantCheck = await query(
      `SELECT * FROM "campaign_participant" WHERE "campaignId" = $1 AND "creatorId" = $2`,
      [campaignId, creatorId]
    );

    if (participantCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Creator is not a participant in this campaign" },
        { status: 403 }
      );
    }

    // Check for duplicate submission
    const duplicateCheck = await query(
      `SELECT * FROM "submission" WHERE "campaignId" = $1 AND "creatorId" = $2 AND platform = $3`,
      [campaignId, creatorId, platform]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "You have already submitted content for this campaign with this platform" },
        { status: 409 }
      );
    }

    const result = await query(
      `INSERT INTO "submission" ("id", "campaignId", "creatorId", "platform", "contentUrl", "caption", "submittedAt", "status", "moderationStatus")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', 'PENDING')
       RETURNING *`,
      [
        crypto.randomUUID(),
        campaignId,
        creatorId,
        platform,
        contentUrl,
        caption || "",
        new Date(),
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Submission creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}