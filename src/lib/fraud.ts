import { Pool, QueryResult } from "pg";
import { query } from "@/lib/db";

export type FraudSignalStatus = "CLEAR" | "REVIEW" | "RESTRICTED" | "CONFIRMED";

export interface FraudSignal {
  id: string;
  creatorId: string;
  submissionId?: string;
  campaignId: string;
  signalType:
    | "sudden_traffic_spike"
    | "suspicious_engagement_ratio"
    | "repeated_accounts"
    | "impossible_velocity"
    | "suspicious_geographic_pattern"
    | "bot_like_interactions"
    | "duplicated_content"
    | "purchased_engagement"
    | "attribution_anomaly";
  severity: number;
  evidence: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  status: FraudSignalStatus;
  createdAt?: string;
}

export interface FraudSignalCreate {
  id: string;
  creatorId: string;
  submissionId?: string;
  campaignId: string;
  signalType: FraudSignal["signalType"], // eslint-disable-line @typescript-eslint/no-explicit-any
  severity: FraudSignal["severity"];
  evidence: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  status: FraudSignalStatus;
}

export class FraudDetectionService {
  /**
   * Analyze a submission for fraud signals
   */
  static async analyzeSubmission(
    submissionId: string,
    campaignId: string
  ): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    // Fetch submission data - use quoted column names
    const submissionQuery = await query(`
      SELECT "id", "campaignId", "creatorId", "platform", "contentUrl", "caption", "submittedAt", "status", "moderationStatus"
      FROM "submission"
      WHERE "id" = $1
    `, [submissionId]);

    if (submissionQuery.rows.length === 0) {
      return signals;
    }

    const submission = submissionQuery.rows[0];

    // Fetch metric snapshot for engagement analysis
    const metricsQuery = await query(`
      SELECT * FROM "content_metric_snapshot"
      WHERE "submissionId" = $1
      ORDER BY "capturedAt" DESC
      LIMIT 1
    `, [submissionId]);

    const metrics = metricsQuery.rows[0];

    // Fetch campaign participant data
    const participantQuery = await query(`
      SELECT * FROM "campaign_participant"
      WHERE "campaignId" = $1 AND "creatorId" = $2
    `, [campaignId, submission.creatorId]);

    // 1. Sudden traffic spike detection
    if (metrics) {
      const viewsPerDay = (metrics.views || 0) / Math.max(1, this.daysSince(submissionId));
      if (viewsPerDay > 100000) {
        signals.push({
          id: `fraud-${Date.now()}-1`,
          creatorId: submission.creatorId,
          submissionId,
          campaignId,
          signalType: "sudden_traffic_spike",
          severity: 4,
          evidence: {
            views: metrics.views,
            viewsPerDay: Math.round(viewsPerDay),
            threshold: 100000,
            metric: "views"
          },
          status: "CLEAR",
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 2. Suspicious engagement ratio detection
    if (metrics) {
      const totalEngagement = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
      const engagementRate = totalEngagement / Math.max(1, (metrics.views || 1));

      // Normal engagement rate is typically 1-5% for social media
      if (engagementRate > 0.15) {
        signals.push({
          id: `fraud-${Date.now()}-2`,
          creatorId: submission.creatorId,
          submissionId,
          campaignId,
          signalType: "suspicious_engagement_ratio",
          severity: 3,
          evidence: {
            views: metrics.views,
            likes: metrics.likes || 0,
            comments: metrics.comments || 0,
            shares: metrics.shares || 0,
            totalEngagement,
            engagementRate: engagementRate.toFixed(4),
            normalRange: "1-5%",
            abnormalFactor: (engagementRate / 0.03).toFixed(2) + "x normal"
          },
          status: "CLEAR",
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 3. Repeated accounts detection (same creator with multiple accounts in same campaign)
    if (participantQuery.rows.length > 1) {
      signals.push({
        id: `fraud-${Date.now()}-3`,
        creatorId: submission.creatorId,
        submissionId,
        campaignId,
        signalType: "repeated_accounts",
        severity: 1,
        evidence: {
          participantCount: participantQuery.rows.length,
          message: "Multiple accounts detected in same campaign"
        },
        status: "CLEAR",
        createdAt: new Date().toISOString()
      });
    }

    // 4. Impossible velocity detection (views impossible for organic growth)
    if (metrics) {
      const ageHours = this.hoursSince(submissionId);
      if (ageHours > 0 && (metrics.views || 0) / ageHours > 10000) {
        signals.push({
          id: `fraud-${Date.now()}-4`,
          creatorId: submission.creatorId,
          submissionId,
          campaignId,
          signalType: "impossible_velocity",
          severity: 5,
          evidence: {
            views: metrics.views,
            ageHours: ageHours.toFixed(2),
            velocity: ((metrics.views || 0) / ageHours).toFixed(2),
            impossibleThreshold: "10,000 views/hour"
          },
          status: "CLEAR",
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 5. Suspicious geographic pattern
    // (Would require geographic data from social accounts - placeholder)
    signals.push({
      id: `fraud-${Date.now()}-5`,
      creatorId: submission.creatorId,
      submissionId,
      campaignId,
      signalType: "suspicious_geographic_pattern",
      severity: 1,
      evidence: { message: "Geographic pattern analysis requires social account data" }, // eslint-disable-line @typescript-eslint/no-explicit-any
      status: "CLEAR",
      createdAt: new Date().toISOString(),
    });

    // 6. Bot-like interactions
    if (metrics) {
      const likeCount = metrics.likes || 0;
      const botThreshold = (metrics.views || 1) * 0.1; // 10% like rate is suspicious at scale
      if (likeCount > botThreshold) {
        signals.push({
          id: `fraud-${Date.now()}-6`,
          creatorId: submission.creatorId,
          submissionId,
          campaignId,
          signalType: "bot_like_interactions",
          severity: 3,
          evidence: {
            views: metrics.views,
            likes: likeCount,
            likeRate: (likeCount / (metrics.views || 1)).toFixed(4),
            threshold: (botThreshold).toFixed(0),
            suspiciousFactor: ((likeCount / botThreshold).toFixed(2) + "x threshold")
          },
          status: "CLEAR",
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 7. Duplicated content detection
    // (Would require content hash comparison - placeholder)
    signals.push({
      id: `fraud-${Date.now()}-7`,
      creatorId: submission.creatorId,
      submissionId,
      campaignId,
      signalType: "duplicated_content",
      severity: 1,
      evidence: { message: "Content duplication check requires media fingerprinting" },
      status: "CLEAR",
      createdAt: new Date().toISOString()
    });

    // 8. Purchased engagement indicators
    if (metrics) {
      const likeCount = metrics.likes || 0;
      const commentCount = metrics.comments || 0;
      // Very low comment-to-like ratio can indicate purchased engagement
      const commentLikeRatio = likeCount > 0 ? commentCount / likeCount : 0;
      if (commentLikeRatio < 0.01) {
        signals.push({
          id: `fraud-${Date.now()}-8`,
          creatorId: submission.creatorId,
          submissionId,
          campaignId,
          signalType: "purchased_engagement",
          severity: 3,
          evidence: {
            views: metrics.views,
            likes: likeCount,
            comments: commentCount,
            commentLikeRatio: commentLikeRatio.toFixed(4),
            normalRange: "0.01-0.05",
            anomaly: "Unusually low comment engagement"
          },
          status: "CLEAR",
          createdAt: new Date().toISOString(),
        });
      }
    }

    return signals;
  }

  /**
   * Create a fraud signal in the database
   */
  static async createSignal(signal: FraudSignalCreate): Promise<FraudSignal> {
    const result = await query(`
      INSERT INTO "fraud_signal" ("id", "creatorId", "submissionId", "campaignId", "signalType", "severity", "evidence", "status")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      signal.id,
      signal.creatorId,
      signal.submissionId,
      signal.campaignId,
      signal.signalType, // eslint-disable-line @typescript-eslint/no-explicit-any
      signal.severity,
      JSON.stringify(signal.evidence),
      signal.status
    ]);

    // @ts-ignore
    return result.rows as FraudSignal[];
  }

  /**
   * Update fraud signal status
   */
  static async getSignals(filters: {
    creatorId?: string;
    campaignId?: string;
    status?: FraudSignalStatus;
  }): Promise<FraudSignal[]> {
    let queryStr = `SELECT * FROM "fraud_signal" WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 0;

    if (filters.creatorId) {
      paramCount++;
      queryStr += ` AND "creatorId" = $${paramCount}`;
      params.push(filters.creatorId);
    }

    if (filters.campaignId) {
      paramCount++;
      queryStr += ` AND "campaignId" = $${paramCount}`;
      params.push(filters.campaignId);
    }

    if (filters.status) {
      paramCount++;
      queryStr += ` AND "status" = $${paramCount}`;
      params.push(filters.status);
    }

    const result: QueryResult<FraudSignal> = await query(queryStr, params);
    // @ts-ignore
    return result.rows as FraudSignal[];
  }

  /**
   * Update fraud signal status
   */
  static async updateSignalStatus(
    signalId: string,
    status: FraudSignalStatus
  ): Promise<FraudSignal> {
    const result = await query(`
      UPDATE "fraud_signal"
      SET "status" = $1
      WHERE "id" = $2
      RETURNING *`, [status, signalId]);

    return result.rows[0] as FraudSignal;
  }

  private static daysSince(submissionId: string): number {
    // Placeholder - in production would calculate from submission date
    return 1;
  }

  private static hoursSince(submissionId: string): number {
    // Placeholder - in production would calculate from submission date
    return 24;
  }
}