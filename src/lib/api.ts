/**
 * ViralWar API Client
 * Provides typed REST communication with the Spring Boot backend on http://localhost:8080/api
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// ─── Token Management ─────────────────────────────────────────────────────────

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("viralwar_access_token");
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("viralwar_access_token", token);
  }
};

export const clearAuthTokens = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("viralwar_access_token");
    localStorage.removeItem("viralwar_refresh_token");
    localStorage.removeItem("viralwar_user");
  }
};

export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem("viralwar_user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("viralwar_user", JSON.stringify(user));
  }
};

// ─── Data Types ───────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  role: "CREATOR" | "BRAND" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  creatorId?: number | null;
  brandId?: number | null;
  displayName?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface Campaign {
  id: number;
  brandId: number;
  brandName?: string;
  title: string;
  slug: string;
  description?: string;
  product?: string;
  objective?: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  budget: number;
  prizePool: number;
  currency: string;
  rules?: string;
  eligibility?: string;
  platforms: string[];
  startAt?: string;
  endAt?: string;
  createdAt?: string;
}

export interface CampaignCreateRequest {
  title: string;
  slug: string;
  description: string;
  product: string;
  objective: string;
  budget: number;
  prizePool: number;
  currency?: string;
  rules?: string;
  eligibility?: string;
  platforms: string[];
  startAt?: string;
  endAt?: string;
}

export interface Submission {
  id: number;
  campaignId?: number;
  campaignTitle?: string;
  campaign?: {
    id: number;
    title: string;
    brand?: {
      id?: number;
      name?: string;
      logo?: string;
    };
  };
  creatorId?: number;
  creatorUsername?: string;
  creatorDisplayName?: string;
  creator?: {
    id: number;
    username: string;
    displayName?: string;
    avatar?: string;
    followerCount?: number;
  };
  platform: string;
  contentUrl: string;
  contentType: string;
  caption?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "LIVE";
  moderationStatus: string;
  submittedAt: string;
}

export interface SubmissionCreateRequest {
  campaignId: number;
  creatorId: number;
  contentUrl: string;
  contentType: string;
  platform: string;
  caption?: string;
}

export interface MetricSnapshot {
  id: number;
  submissionId: number;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  engagementRate: number;
  capturedAt: string;
}

export interface LeaderboardEntry {
  id: number;
  campaignId?: number;
  creatorId?: number;
  creator?: CreatorProfile;
  creatorUsername?: string;
  creatorDisplayName?: string;
  creatorAvatar?: string;
  score: number;
  views: number;
  engagement: number;
  conversions: number;
  trend: number;
  movement: "UP" | "DOWN" | "STABLE" | "NONE";
  capturedAt: string;
}

export interface CreatorProfile {
  id: number;
  userId: number;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  location?: string;
  followerCount: number;
  verifiedStatus: boolean;
  reputationScore: number;
  categories: string[];
  languages?: string[];
}

export interface FraudSignal {
  id: number;
  creatorId: number;
  creatorUsername?: string;
  campaignId: number;
  campaignTitle?: string;
  submissionId?: number;
  signalType: string;
  severity: number;
  severityScore?: number;
  status: "CLEAR" | "REVIEW" | "RESTRICTED" | "CONFIRMED";
  evidence?: string;
  description?: string;
  createdAt: string;
}

export interface YouTubeLiveStats {
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  engagementRate: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ─── Fetch Wrapper ───────────────────────────────────────────────────────────

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) errorMessage = errorJson.message;
      else if (errorJson.error) errorMessage = errorJson.error;
    } catch {
      // Use fallback error message
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

export const api = {
  // Auth
  auth: {
    login: (body: { email: string; password: string }) =>
      fetchApi<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    register: (body: {
      email: string;
      password: string;
      role: string;
      displayName?: string;
      handle?: string;
    }) =>
      fetchApi<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    me: () => fetchApi<User>("/auth/me"),
  },

  // Campaigns
  campaigns: {
    list: (page = 0, size = 20) =>
      fetchApi<PageResponse<Campaign>>(`/campaigns?page=${page}&size=${size}`),

    getById: (id: number) => fetchApi<Campaign>(`/campaigns/${id}`),

    getBySlug: (slug: string) => fetchApi<Campaign>(`/campaigns/slug/${slug}`),

    create: (brandId: number, body: CampaignCreateRequest) =>
      fetchApi<Campaign>(`/campaigns?brandId=${brandId}`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    updateStatus: (id: number, status: string) =>
      fetchApi<Campaign>(`/campaigns/${id}/status?status=${status}`, {
        method: "PATCH",
      }),
  },

  // Submissions
  submissions: {
    list: (campaignId?: number, creatorId?: number, page = 0, size = 20) => {
      let query = `?page=${page}&size=${size}`;
      if (campaignId) query += `&campaignId=${campaignId}`;
      if (creatorId) query += `&creatorId=${creatorId}`;
      return fetchApi<PageResponse<Submission>>(`/submissions${query}`);
    },

    getById: (id: number) => fetchApi<Submission>(`/submissions/${id}`),

    create: (body: SubmissionCreateRequest) =>
      fetchApi<Submission>("/submissions", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    updateStatus: (id: number, status: string) => {
      const upper = status.toUpperCase();
      if (upper === "APPROVED" || upper === "LIVE") {
        return fetchApi<Submission>(`/submissions/${id}/approve`, {
          method: "PATCH",
        });
      }
      if (upper === "REJECTED") {
        return fetchApi<Submission>(`/submissions/${id}/reject`, {
          method: "PATCH",
        });
      }
      return fetchApi<Submission>(`/submissions/${id}/status?status=${status}`, {
        method: "PATCH",
      });
    },
  },

  // Metrics
  metrics: {
    refreshSnapshot: (submissionId: number) =>
      fetchApi<MetricSnapshot>(`/metrics/refresh/${submissionId}`, {
        method: "POST",
      }),

    getSnapshots: (submissionId: number, page = 0, size = 10) =>
      fetchApi<PageResponse<MetricSnapshot>>(
        `/metrics/submission/${submissionId}?page=${page}&size=${size}`
      ),

    getYouTubeVideo: (videoId: string) =>
      fetchApi<YouTubeLiveStats>(`/metrics/youtube/video/${videoId}`),

    getYouTubeChannel: (channelId: string) =>
      fetchApi<any>(`/metrics/youtube/channel/${channelId}`),
  },

  // Leaderboard
  leaderboard: {
    getByCampaign: async (campaignId: number): Promise<LeaderboardEntry[]> => {
      try {
        const res = await fetchApi<any>(`/leaderboard/campaign/${campaignId}`);
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.content)) return res.content;
        return [];
      } catch {
        return [];
      }
    },

    getByCreator: async (creatorId: number): Promise<LeaderboardEntry[]> => {
      try {
        const res = await fetchApi<any>(`/leaderboard/creator/${creatorId}`);
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.content)) return res.content;
        return [];
      } catch {
        return [];
      }
    },
  },

  // Creators
  creators: {
    list: (page = 0, size = 20) =>
      fetchApi<PageResponse<CreatorProfile>>(
        `/creators?page=${page}&size=${size}`
      ),

    getById: (id: number) => fetchApi<CreatorProfile>(`/creators/${id}`),

    getByUsername: (username: string) =>
      fetchApi<CreatorProfile>(`/creators/username/${username}`),

    toggleVerify: (id: number, verified: boolean) =>
      fetchApi<CreatorProfile>(`/creators/${id}/verify?verified=${verified}`, {
        method: "PATCH",
      }),
  },

  // Fraud
  fraud: {
    list: (status?: string, page = 0, size = 20) => {
      let query = `?page=${page}&size=${size}`;
      if (status) query += `&status=${status}`;
      return fetchApi<PageResponse<FraudSignal>>(`/fraud${query}`);
    },

    updateStatus: (id: number, status: string) =>
      fetchApi<FraudSignal>(`/fraud/${id}/status?status=${status}`, {
        method: "PATCH",
      }),
  },

  // System Health
  health: () =>
    fetch(`${API_BASE_URL}/actuator/health`)
      .then((r) => r.json())
      .catch(() => ({ status: "DOWN" })),
};
