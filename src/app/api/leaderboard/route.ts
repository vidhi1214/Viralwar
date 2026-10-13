import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get("campaignId");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Fetch leaderboard entries for this campaign, ordered by rank
    const countQuery = await query(`
      SELECT COUNT(*) as total FROM "leaderboard_entry" WHERE "campaignId" = $1
    `, [campaignId]);

    const entriesQuery = await query(`
      SELECT le.*, u.email as creatorEmail, cp.username, cp.displayName, cp.avatar
      FROM "leaderboard_entry" le
      JOIN "creator_profile" cp ON le."creatorId" = cp."userId"
      JOIN "user" u ON cp."userId" = u."id"
      WHERE le."campaignId" = $1
      ORDER BY le."rank" ASC
      LIMIT $2 OFFSET $3
    `, [campaignId, limit, offset]);

    return NextResponse.json({
      entries: entriesQuery.rows,
      total: countQuery.rows[0]?.total || 0,
      hasMore: (offset + limit) < (countQuery.rows[0]?.total || 0)
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, creatorId, score, views, engagement, conversions, rank } = body;

    if (!campaignId || !creatorId) {
      return NextResponse.json(
        { error: "Campaign ID and Creator ID are required" },
        { status: 400 }
      );
    }

    // Check if this creator already has a leaderboard entry for this campaign
    const existing = await query(`
      SELECT * FROM "leaderboard_entry" WHERE "campaignId" = $1 AND "creatorId" = $2
    `, [campaignId, creatorId]);

    if (existing.rows.length > 0) {
      // Update existing entry
      const updated = await query(`
        UPDATE "leaderboard_entry"
        SET "score" = $1, "views" = $2, "engagement" = $3, "conversions" = $4, "rank" = $5, "capturedAt" = NOW()
        WHERE "id" = $6
        RETURNING *
      `, [score, views, engagement, conversions, rank, existing.rows[0].id]);

      return NextResponse.json(updated.rows[0]);
    } else {
      // Create new entry - determine rank based on score
      // Higher score = better rank (rank 1 is best)
      const rankQuery = await query(`
        SELECT COUNT(*) as higherCount FROM "leaderboard_entry" 
        WHERE "campaignId" = $1 AND "score" > $2
      `, [campaignId, score]);

      const rank = (rankQuery.rows[0]?.higherCount || 0) + 1;

      const newEntry = await query(`
        INSERT INTO "leaderboard_entry" ("id", "campaignId", "creatorId", "score", "views", "engagement", "conversions", "rank", "capturedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `, [
        "lb-" + campaignId + "-" + creatorId + "-" + Date.now(),
        campaignId,
        creatorId,
        score,
        views,
        engagement,
        conversions,
        rank
      ]);

      return NextResponse.json(newEntry.rows[0]);
    }
  } catch (error) {
    console.error("Leaderboard update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}