import { Pool, QueryResult } from "pg";
import { query } from "@/lib/db";

export interface ScoringMetric {
  metric: "views" | "likes" | "comments" | "shares" | "saves" | "watch_time" | "clicks" | "conversions" | "revenue";
  value: number;
}

export interface ScoringConfig {
  metricWeights: Record<string, number>;
  caps?: Record<string, { type: "absolute" | "percentage"; value: number }>;
  minimumThresholds?: Record<string, number>;
}

export interface ScoreBreakdown {
  metric: string;
  value: number;
  weightedScore: number;
}

export interface ScoredSubmission {
  submissionId: string;
  creatorId: string;
  campaignId: string;
  score: number;
  rank: number;
  breakdown: ScoreBreakdown[];
}

export class ScoringService {
  /**
   * Calculate a score for a submission based on campaign configuration
   */
  static async calculateScore(
    submissionId: string,
    campaignId: string
  ): Promise<ScoredSubmission> {
    // Fetch the submission with its metric snapshots
    const submissionQuery = await query(`
      SELECT s.*, cp."creatorId" as creator_id
      FROM "submission" s
      JOIN "creator_profile" cp ON s."creatorId" = cp."userId"
      WHERE s."id" = \$1
    `, [submissionId]);

    if (submissionQuery.rows.length === 0) {
      throw new Error("Submission not found");
    }

    const submission = submissionQuery.rows[0];

    // Fetch the campaign metric configuration
    const metricConfigQuery = await query(`
      SELECT "metric", "weight", "capType", "capValue", "minimumThreshold"
      FROM "campaign_metric_config"
      WHERE "campaignId" = \$1
    `, [campaignId]);

    const metricConfigs = metricConfigQuery.rows;

    if (metricConfigs.length === 0) {
      // Default scoring if no config is set
      return this.calculateDefaultScore(submission as any, submissionId); // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // Fetch the metric snapshots for this submission
    const snapshotsQuery = await query(`
      SELECT * FROM "content_metric_snapshot"
      WHERE "submissionId" = \$1
      ORDER BY "capturedAt" DESC
      LIMIT 1
    `, [submissionId]);

    const snapshots = snapshotsQuery.rows;

    if (snapshots.length === 0) {
      return {
        submissionId,
        creatorId: submission.creatorId,
        campaignId,
        score: 0,
        rank: 0,
        breakdown: [],
      };
    }

    const snapshot = snapshots[0];

    // Calculate weighted score based on configured metrics
    const breakdown: ScoreBreakdown[] = [];
    let totalScore = 0;

    for (const config of metricConfigs) {
      const metric = config.metric;
      const weight = config.weight || 1;
      const capType = config.capType;
      const capValue = config.capValue;
      const minimumThreshold = config.minimumThreshold;

      const rawValue = snapshot[metric] || 0;

      // Apply minimum threshold if set
      let effectiveValue = rawValue;
      if (minimumThreshold && rawValue < minimumThreshold) {
        effectiveValue = 0; // Below threshold, no score
      }

      // Apply cap if set
      if (capType && capValue) {
        if (capType === "percentage") {
          // Cap as percentage of some reference (e.g., views)
          effectiveValue = Math.min(effectiveValue, capValue);
        } else if (capType === "absolute") {
          effectiveValue = Math.min(effectiveValue, capValue);
        }
      }

      const weightedScore = effectiveValue * weight;
      totalScore += weightedScore;

      breakdown.push({
        metric,
        value: rawValue,
        weightedScore,
      });
    }

    // Determine rank based on score (will be updated later when comparing across submissions)
    const rank = 1; // Placeholder - actual ranking happens when comparing multiple submissions

    return {
      submissionId,
      creatorId: submission.creatorId,
      campaignId,
      score: totalScore,
      rank,
      breakdown,
    };
  }

  /**
   * Calculate default score using the example formula from the spec:
   * score = 40% retention + 25% engagement + 20% attributed conversions + 10% qualified reach + 5% shares
   * But make weights configurable
   */
  static async calculateDefaultScore(
    submission: { id: string; campaignId: string; creatorId: string; platform?: string; contentUrl?: string; caption?: string; submittedAt?: string; status?: string; moderationStatus?: string; },
    submissionId: string
  ): Promise<ScoredSubmission> {
    // Default weights (can be overridden per campaign)
    const defaultWeights = {
      views: 0.10,      // qualified reach
      likes: 0.25,      // engagement
      comments: 0.15,   // engagement
      shares: 0.05,     // shares
      saves: 0.10,      // saves
      watch_time: 0.40, // retention
      clicks: 0.05,     // clicks
      conversions: 0.20, // attributed conversions
      revenue: 0.10,    // revenue
    };

    // Get the latest metric snapshot
    const snapshotsQuery = await query(`
      SELECT * FROM "content_metric_snapshot"
      WHERE "submissionId" = \$1
      ORDER BY "capturedAt" DESC
      LIMIT 1
    `, [submissionId]);

    const snapshots = snapshotsQuery.rows;
    const snapshot = snapshots[0];

    if (!snapshot) {
      return {
        submissionId,
        creatorId: "",
        campaignId: "",
        score: 0,
        rank: 0,
        breakdown: [],
      };
    }

    const breakdown: ScoreBreakdown[] = [];
    let totalScore = 0;

    // Calculate score using default weights
    for (const [metric, weight] of Object.entries(defaultWeights) as [string, number][]) {
      const rawValue = snapshot[metric] || 0;
      const weightedScore = rawValue * weight;
      totalScore += weightedScore;
      breakdown.push({
        metric,
        value: rawValue,
        weightedScore,
      });
    }

    return {
      submissionId,
      creatorId: submission.creatorId,
      campaignId: submission.campaignId,
      score: totalScore,
      rank: 1,
      breakdown,
    };
  }
}