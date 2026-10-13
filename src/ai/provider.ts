// AI Provider Types for VIRAL WAR
// Evidence-first AI architecture types following the pipeline:
// Content → Feature Extraction → Performance Time Series → Baseline Normalization
// → Cohort Analysis → Statistical Pattern Detection → Evidence Package → LLM Interpretation → Validated Insight

// Feature extraction types
export interface VideoFeatures {
  duration: number;
  firstFrameTime: number;
  hookStructure: "early_reveal" | "mid_reveal" | "late_reveal";
  productAppearanceTiming: number;
  productRevealTiming: number;
  sceneChanges: number;
  cuts: number;
  framing: "portrait" | "landscape" | "mixed";
  cameraStyle: "static" | "panning" | "tracking" | "handheld" | "mixed";
  visualComposition: "centered" | "rule_of_thirds" | "dynamic" | "static";
  textOverlays: number;
  detectedObjects: string[];
  setting: "studio" | "outdoor" | "indoor" | "mixed";
  transitions: string[];
}

export interface AudioFeatures {
  speechSpeed: number;
  hasSpeech: boolean;
  hasMusic: boolean;
  hasSoundEffects: boolean;
  silenceRatio: number;
  audioType: "original" | "licensed" | "mixed";
  relevantAudioCharacteristics: string[];
}

export interface TranscriptFeatures {
  openingHook: string;
  problemStatement: string;
  storyArc: string;
  productIntroductionTiming: number;
  proofPoints: string[];
  callToAction: string;
  questionsAsked: number;
  humorScore: number;
  curiosityMarkers: number;
  emotionalLanguageScore: number;
  claims: string[];
}

export interface CaptionFeatures {
  length: number;
  keywordDensity: Record<string, number>;
  ctaPresent: boolean;
  hashtags: string[];
  tone: "formal" | "informal" | "energetic" | "calm" | "urgent" | "mixed";
  structure: "problem_solution" | "story" | "list" | "question" | "other";
}

// Comment features, where permitted
export interface CommentFeatures {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  recurringQuestions: string[];
  objections: string[];
  audienceLanguage: string[];
  purchaseIntent: number;
  confusionMarkers: number;
  recurringThemes: string[];
}

// Evidence package structure
export interface EvidencePackage {
  claim: string;
  evidence: Record<string, any>;
  sampleSize: number;
  comparisonGroup?: string;
  effectSize?: number;
  confidence: "Low" | "Moderate" | "High";
  period: string;
  dataSource: string;
  methodology: string;
  limitations: string[];
  metricSnapshotIds?: string[];
}

// Metric snapshot for time-series
export interface MetricSnapshot {
  id: string;
  timestamp: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTime: number;
  clicks: number;
  conversions: number;
  retentionRate?: number;
  engagementRate?: number;
}

// Insight type enum
export enum InsightType {
  WinningPattern = "Winning Pattern",
  WeakPattern = "Weak Pattern",
  BreakoutCreator = "Breakout Creator",
  BreakoutContent = "Breakout Content",
  HookIntelligence = "Hook Intelligence",
  RetentionIntelligence = "Retention Intelligence",
  ConversionIntelligence = "Conversion Intelligence",
  AudienceIntelligence = "Audience Intelligence",
  FormatIntelligence = "Format Intelligence",
  TimingIntelligence = "Timing Intelligence",
  CampaignIntelligence = "Campaign Intelligence",
}

// Creator baseline
export interface CreatorBaseline {
  creatorId: string;
  historicalMetrics: Record<string, number>;
  campaignBaselines: Record<string, Record<string, number>>;
  categoryBaseline: Record<string, number>;
  totalSubmissions: number;
  averageViews: number;
  medianViews: number;
}

// Performance explanation
export interface PerformanceExplanation {
  creatorId: string;
  campaignId: string;
  submissionId: string;
  baselineComparison: {
    creatorBaseline: number;
    currentPerformance: number;
    uplift: number;
    upliftPercentage: number;
  };
  cohortComparison?: {
    topQuintileAverage: number;
    bottomQuintileAverage: number;
    comparison: string;
  };
  statisticalSummary: {
    sampleSize: number;
    confidence: "Low" | "Moderate" | "High";
    method: string;
  };
  evidencePackage: EvidencePackage;
  insightType: InsightType;
}

// AI insight result
export interface AIInsightResult {
  id: string;
  campaignId: string;
  insightType: InsightType;
  summary: string;
  confidence: number;
  evidencePackage: EvidencePackage;
  metricSnapshots: MetricSnapshot[];
  generatedAt: string;
  recommendations?: string[];
}

// Feature extraction result
export interface FeatureExtractionResult {
  submissionId: string;
  videoFeatures: VideoFeatures;
  audioFeatures: AudioFeatures;
  transcriptFeatures: TranscriptFeatures;
  captionFeatures: CaptionFeatures;
  commentFeatures?: CommentFeatures;
  extractionVersion: string;
  modelVersion: string;
  extractedAt: string;
  confidence: number;
}

// Cohort comparison result
export interface CohortComparison {
  comparisonId: string;
  cohortA: "top_quartile" | "top_half" | "custom";
  cohortB: "bottom_quartile" | "bottom_half" | "custom";
  metric: "views" | "engagement" | "retention" | "conversions" | "watch_time";
  cohortAAverage: number;
  cohortBAverage: number;
  difference: number;
  percentageDifference: number;
  confidence: "Low" | "Moderate" | "High";
  sampleSizeA: number;
  sampleSizeB: number;
  methodology: string;
  limitations: string[];
}

// Statistical test result
export interface StatisticalTest {
  testId: string;
  testType: "t_test" | "chi_square" | "correlation" | "regression" | "non_parametric";
  comparisonGroupA: string;
  comparisonGroupB: string;
  metric: string;
  effectSize: number;
  pValue: number;
  confidenceInterval: [number, number];
  sampleSize: number;
  conclusion: "supports_hypothesis" | "no_significant_effect" | "inconclusive";
  confidence: "Low" | "Moderate" | "High";
}

// Data quality metadata
export interface DataQualityMetadata {
  source: "verified" | "estimated" | "simulated" | "unavailable";
  capturedAt: string;
  freshness: "real_time" | "hourly" | "daily" | "weekly" | "unknown";
  verified: boolean;
  estimated: boolean;
  simulated: boolean;
  unavailable: boolean;
}

// Full analytical output
export interface AnalyticalOutput {
  submissionId: string;
  featureExtraction: FeatureExtractionResult;
  performanceTimeSeries: MetricSnapshot[];
  creatorBaseline?: CreatorBaseline;
  cohortAnalysis?: CohortComparison;
  statisticalTests: StatisticalTest[];
  evidencePackage: EvidencePackage;
  insightType: InsightType;
  confidence: "Low" | "Moderate" | "High";
  insight: string;
  limitations: string[];
  dataQuality: DataQualityMetadata;
  version: {
    metricSnapshotVersion: string;
    featureExtractionVersion: string;
    aiModelVersion: string;
    promptVersion: string;
    methodologyVersion: string;
    generationTimestamp: string;
  };
}

// Database types
export interface DbMetricSnapshot {
  id: string;
  submissionId: string;
  timestamp: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTime: number;
  clicks: number;
  conversions: number;
  retentionRate?: number;
  engagementRate?: number;
  metricSnapshotVersion: string;
}

export interface DbEvidencePackage {
  id: string;
  claim: string;
  evidence: Record<string, any>;
  sampleSize: number;
  comparisonGroup?: string;
  effectSize?: number;
  confidence: "Low" | "Moderate" | "High";
  period: string;
  dataSource: string;
  methodology: string;
  limitations: string[];
  metricSnapshotIds: string[];
  insightType: InsightType;
  insight: string;
  createdAt: string;
  createdBy: string;
  metricSnapshotVersion: string;
  featureExtractionVersion: string;
  aiModelVersion: string;
  promptVersion: string;
  methodologyVersion: string;
}

// Query parameter types
export interface FeatureExtractionQuery {
  submissionId: string;
  campaignId: string;
  platform: string;
}

export interface TimeSeriesQuery {
  submissionId: string;
  intervals: ("1_hour" | "3_hour" | "6_hour" | "12_hour" | "24_hour" | "48_hour")[];
}

export interface CohortQuery {
  campaignId: string;
  metric: "views" | "engagement" | "retention" | "conversions";
  cohortSize: "top_10" | "top_25" | "top_50" | "bottom_25" | "bottom_50" | "custom";
}

// Response types for API
export interface AnalyzeSubmissionResponse {
  success: boolean;
  featureExtraction: FeatureExtractionResult;
  metricSnapshots: MetricSnapshot[];
  evidencePackage: EvidencePackage;
  insight?: {
    insightType: InsightType;
    summary: string;
    confidence: number;
    evidence: Record<string, any>;
  };
  error?: string;
}

export interface AnalyzeCampaignResponse {
  success: boolean;
  winningPatterns: any[];
  cohortAnalyses: CohortComparison[];
  statisticalTests: StatisticalTest[];
  evidencePackages: EvidencePackage[];
  insight?: {
    insightType: InsightType;
    summary: string;
    confidence: number;
    evidence: Record<string, any>;
  };
  error?: string;
}

// Baseline comparison request
export interface BaselineComparisonRequest {
  creatorId: string;
  campaignId: string;
  submissionMetrics: Record<string, number>;
}

// Cohort analysis request
export interface CohortAnalysisRequest {
  campaignId: string;
  metric: "views" | "engagement" | "retention" | "conversions";
  cohortComparison: "top_vs_bottom" | "top_vs_overall" | "bottom_vs_overall";
}

// Export all types for use in other modules
