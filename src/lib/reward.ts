import { Pool, QueryResult } from "pg";
import { query } from "@/lib/db";

export type RewardStatus = "CALCULATING" | "PENDING_REVIEW" | "APPROVED" | "PROCESSING" | "PAID" | "FAILED" | "DISPUTED";

export interface Reward {
  id: string;
  campaignId: string;
  creatorId: string;
  amount: number;
  currency: string;
  reason: string;
  status: RewardStatus;
  calculatedAt: string;
  paidAt?: string;
}

export interface RewardCalculation {
  campaignId: string;
  creatorId: string;
  baseAmount: number;
  performanceBonus: number;
  totalAmount: number;
  distribution: "FIXED" | "PERFORMANCE" | "HYBRID";
  currency?: string;
  reason?: string;
}

export interface Payout {
  id: string;
  rewardId: string;
  provider: string;
  providerReference?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  amount: number;
  currency: string;
  failureReason?: string;
  processedAt?: string;
}

export class RewardEngine {
  /**
   * Calculate rewards for a campaign based on configured rules
   */
  static async calculateRewards(
    campaignId: string,
    creatorId: string,
    calculation: RewardCalculation
  ): Promise<Reward> {
    // Default distribution type (hybrid: base + performance bonus)
    const distribution: "FIXED" | "PERFORMANCE" | "HYBRID" = "HYBRID";

    let baseAmount = 0;
    let performanceBonus = 0;

    // Fixed prize calculation (1st: ₹2L, 2nd: ₹1L, 3rd: ₹50K)
    // Performance pool distribution (proportional based on verified performance)
    // Hybrid: base + performance bonus

    // Calculate performance score for this creator
    const submissions = await query(`
      SELECT s.*, sm.views, sm.likes, sm.comments, sm.shares, sm.watchTime, sm.clicks, sm.conversions, sm.revenue
      FROM "submission" s
      JOIN "content_metric_snapshot" sm ON s."id" = sm."submissionId"
      WHERE s."campaignId" = $1 AND s."creatorId" = $2
      ORDER BY (sm.views + sm.likes + sm.comments + sm.shares) DESC
      LIMIT 1
    `, [campaignId, creatorId]);

    if (submissions.rows.length > 0) {
      const sub = submissions.rows[0];
      const metrics = sub;

      // Performance calculation based on normalized metrics
      const performanceScore =
        (metrics.views || 0) * 0.1 +
        (metrics.likes || 0) * 0.2 +
        (metrics.comments || 0) * 0.15 +
        (metrics.shares || 0) * 0.05 +
        (metrics.watchTime || 0) * 0.4 +
        (metrics.clicks || 0) * 0.05 +
        (metrics.conversions || 0) * 1.0 +
        (metrics.revenue || 0) * 0.1;

      // Determine rank/tier based on performance score
      let tierBonus = 0;
      if (performanceScore >= 100000) {
        // Top performer - 1st tier
        tierBonus = calculation.baseAmount * 0.5; // 50% bonus
      } else if (performanceScore >= 50000) {
        // Second tier
        tierBonus = calculation.baseAmount * 0.3; // 30% bonus
      } else if (performanceScore > 0) {
        // Third tier
        tierBonus = calculation.baseAmount * 0.2; // 20% bonus
      }

      baseAmount = calculation.baseAmount;
      performanceBonus = tierBonus;
    } else {
      baseAmount = calculation.baseAmount;
      performanceBonus = 0;
    }

    const totalAmount = baseAmount + performanceBonus;

    // Create reward record
    const rewardId = `reward-${campaignId}-${creatorId}-${Date.now()}`;
    const calculatedAt = new Date().toISOString();

    const result = await query(`
      INSERT INTO "reward" ("id", "campaignId", "creatorId", "amount", "currency", "reason", "status", "calculatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, 'CALCULATING', $7)
      RETURNING *
    `, [
      rewardId,
      campaignId,
      creatorId,
      totalAmount,
      calculation.currency || "INR",
      calculation.reason || "Performance-based reward",
      calculatedAt,
    ]);

    // Update reward status to CALCULATING → PENDING_REVIEW
    await query(`
      UPDATE "reward"
      SET "status" = 'PENDING_REVIEW'
      WHERE "id" = $1
    `, [rewardId]);

    return result.rows[0] as Reward;
  }

  /**
   * Approve a reward (move from PENDING_REVIEW to APPROVED)
   */
  static async approveReward(rewardId: string): Promise<Reward> {
    const result = await query(`
      UPDATE "reward"
      SET "status" = 'APPROVED'
      WHERE "id" = $1
      RETURNING *
    `, [rewardId]);

    return result.rows[0] as Reward;
  }

  /**
   * Process a reward (move from APPROVED to PROCESSING)
   */
  static async processReward(rewardId: string): Promise<Reward> {
    const result = await query(`
      UPDATE "reward"
      SET "status" = 'PROCESSING'
      WHERE "id" = $1
      RETURNING *
    `, [rewardId]);

    return result.rows[0] as Reward;
  }

  /**
   * Complete/pay a reward (move from PROCESSING to PAID)
   */
  static async payReward(rewardId: string, provider: string, providerReference?: string): Promise<Reward> {
    const now = new Date().toISOString();

    const result = await query(`
      UPDATE "reward"
      SET "status" = 'PAID', "paidAt" = $1
      WHERE "id" = $2
      RETURNING *
    `, [now, rewardId]);

    // Create payout record
    await query(`
      INSERT INTO "payout" ("id", "rewardId", "provider", "providerReference", "status", "amount", "currency")
      VALUES ($1, $2, $3, $4, 'COMPLETED', $5, $6)
    `, [
      `payout-${rewardId}`,
      rewardId,
      provider,
      providerReference,
      result.rows[0].amount,
      result.rows[0].currency,
    ]);

    return result.rows[0] as Reward;
  }

  /**
   * Get rewards for a campaign
   */
  static async getRewards(filters: {
    campaignId?: string;
    creatorId?: string;
    status?: RewardStatus;
  }): Promise<Reward[]> {
    let queryStr = `SELECT * FROM "reward" WHERE 1=1`;
    const params: (string | number)[] = [];
    let paramCount = 0;

    if (filters.campaignId) {
      paramCount++;
      queryStr += ` AND "campaignId" = $${paramCount}`;
      params.push(filters.campaignId);
    }

    if (filters.creatorId) {
      paramCount++;
      queryStr += ` AND "creatorId" = $${paramCount}`;
      params.push(filters.creatorId);
    }

    if (filters.status) {
      paramCount++;
      queryStr += ` AND "status" = $${paramCount}`;
      params.push(filters.status);
    }

    const result = await query(queryStr, params);
    return result.rows as Reward[];
  }

  /**
   * Get payouts for a reward
   */
  static async getPayouts(filters: {
    rewardId?: string;
    status?: string;
  }): Promise<Payout[]> {
    let queryStr = `SELECT * FROM "payout" WHERE 1=1`;
    const params: (string | number)[] = [];
    let paramCount = 0;

    if (filters.rewardId) {
      paramCount++;
      queryStr += ` AND "rewardId" = $${paramCount}`;
      params.push(filters.rewardId);
    }

    if (filters.status) {
      paramCount++;
      queryStr += ` AND "status" = $${paramCount}`;
      params.push(filters.status);
    }

    const result = await query(queryStr, params);
    const payouts: Payout[] = result.rows.map((r: { [k: string]: any }) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: r.id,
      rewardId: r.rewardId,
      provider: r.provider,
      providerReference: r.providerReference,
      status: r.status,
      amount: r.amount,
      currency: r.currency,
      failureReason: r.failureReason,
      processedAt: r.processedAt,
    } as Payout));
    return payouts;
  }
}