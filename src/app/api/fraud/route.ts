import { NextResponse } from "next/server";
import { FraudDetectionService, FraudSignal, FraudSignalStatus } from "@/lib/fraud";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submissionId, campaignId } = body;

    if (!submissionId && !campaignId) {
      return NextResponse.json(
        { error: "Either submissionId or campaignId is required" },
        { status: 400 }
      );
    }

    let signals: FraudSignal[] = [];

    if (submissionId) {
      // Analyze specific submission
      signals = await FraudDetectionService.analyzeSubmission(submissionId, campaignId || "");

      // Create signals in database
      for (const signal of signals) {
        await FraudDetectionService.createSignal({
          id: signal.id,
          creatorId: signal.creatorId,
          submissionId: signal.submissionId,
          campaignId: signal.campaignId,
          signalType: signal.signalType,
          severity: signal.severity,
          evidence: signal.evidence,
          status: signal.status
        });
      }
    } else if (campaignId) {
      // Analyze all submissions for campaign
      const submissionsQuery = await query(`
        SELECT s.* FROM "submission" s
        WHERE s."campaignId" = $1
      `, [campaignId]);

      for (const submission of submissionsQuery.rows) {
        const subSignals = await FraudDetectionService.analyzeSubmission(submission.id, campaignId);
        for (const signal of subSignals) {
          await FraudDetectionService.createSignal({
            id: signal.id,
            creatorId: signal.creatorId,
            submissionId: signal.submissionId,
            campaignId: signal.campaignId,
            signalType: signal.signalType,
            severity: signal.severity,
            evidence: signal.evidence,
            status: signal.status
          });
        }
        signals.push(...subSignals);
      }
    }

    // Fetch updated signals from database
    const dbSignals = await FraudDetectionService.getSignals({
      campaignId
    });

    return NextResponse.json({
      signals: dbSignals,
      totalAnalyzed: signals.length,
      highSeverity: dbSignals.filter((s: FraudSignal) => s.severity === Number("HIGH") || s.severity === Number("CRITICAL")).length,
      confirmedSignals: dbSignals.filter((s: FraudSignal) => s.status === "CONFIRMED").length
    });
  } catch (error) {
    console.error("Fraud analysis error:", error);
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

    const filters: { campaignId?: string; creatorId?: string; status?: FraudSignalStatus } = {};
    if (campaignId) {
      filters.campaignId = campaignId;
    }
    if (creatorId) {
      filters.creatorId = creatorId;
    }
    if (status) {
      filters.status = status as FraudSignalStatus;
    }

    const signals = await FraudDetectionService.getSignals(filters);

    return NextResponse.json({
      signals,
      total: signals.length,
      bySeverity: {
        critical: signals.filter((s: FraudSignal) => s.severity === Number("CRITICAL")).length,
        high: signals.filter((s: FraudSignal) => s.severity === Number("HIGH")).length,
        medium: signals.filter((s: FraudSignal) => s.severity === Number("MEDIUM")).length,
        low: signals.filter((s: FraudSignal) => s.severity === Number("LOW")).length
      },
      byStatus: {
        confirmed: signals.filter((s: FraudSignal) => s.status === "CONFIRMED").length,
        review: signals.filter((s: FraudSignal) => s.status === "REVIEW").length,
        clear: signals.filter((s: FraudSignal) => s.status === "CLEAR").length
      }
    });
  } catch (error) {
    console.error("Fraud signals fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}