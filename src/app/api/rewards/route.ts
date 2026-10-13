import { NextResponse } from "next/server";
import { RewardEngine, Reward, RewardStatus, RewardCalculation } from "@/lib/reward";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, creatorId, baseAmount, currency, reason } = body;

    if (!campaignId || !creatorId) {
      return NextResponse.json(
        { error: "Campaign ID and Creator ID are required" },
        { status: 400 }
      );
    }

    // Calculate rewards
    const calculation: RewardCalculation = {
      campaignId,
      creatorId,
      baseAmount: baseAmount || 50000, // Default ₹50K base
      currency: currency || "INR",
      reason: reason || "Performance-based reward",
      performanceBonus: 0,
      totalAmount: (baseAmount || 50000) + 0,
      distribution: "HYBRID",
    };

    const reward = await RewardEngine.calculateRewards(
      campaignId,
      creatorId,
      calculation
    );

    return NextResponse.json(reward, { status: 201 });
  } catch (error) {
    console.error("Reward calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const creatorId = searchParams.get("creatorId");
    const status = searchParams.get("status");

    const filters: any = {};
    if (campaignId) {
      filters.campaignId = campaignId;
    }
    if (creatorId) {
      filters.creatorId = creatorId;
    }
    if (status) {
      filters.status = status as RewardStatus;
    }

    const rewards = await RewardEngine.getRewards(filters);

    return NextResponse.json(rewards);
  } catch (error) {
    console.error("Rewards fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { rewardId, status } = body;

    if (!rewardId || !status) {
      return NextResponse.json(
        { error: "Reward ID and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "CALCULATING",
      "PENDING_REVIEW",
      "APPROVED",
      "PROCESSING",
      "PAID",
      "FAILED",
      "DISPUTED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const reward = await RewardEngine.approveReward(rewardId);

    // If approving, move to next state
    let updatedReward = reward;
    if (status === "APPROVED") {
      updatedReward = await RewardEngine.processReward(rewardId);
    }

    return NextResponse.json(updatedReward);
  } catch (error) {
    console.error("Reward update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}