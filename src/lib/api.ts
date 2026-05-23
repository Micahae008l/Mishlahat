import { clearToken, getToken } from "./auth";

function apiBase(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  return raw?.replace(/\/$/, "") ?? "";
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type ApiFetchOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch<T>(path: string, init?: ApiFetchOptions): Promise<T> {
  const { skipAuth, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  if (!headers.has("Content-Type") && rest.body != null) {
    headers.set("Content-Type", "application/json");
  }
  const token = skipAuth ? null : getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${apiBase()}${path}`, { ...rest, headers });
  const text = await res.text();
  let json: unknown = {};
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = {};
    }
  }
  if (!res.ok) {
    let msg =
      typeof json === "object" && json !== null && "error" in json && typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : res.statusText;
    if ((!msg || msg === "Internal Server Error") && (res.status === 500 || res.status === 502)) {
      msg = "שגיאת שרת. בפיתוח מקומי: הריצו npm run dev (Vite + API) או npm run server ליד Vite.";
    }
    if ((!msg || msg === "Service Unavailable") && res.status === 503) {
      msg =
        "השרת לא זמין (503). בפיתוח: הריצו מהשורש npm run dev, או npm run server (פורט 3001) לצד npm run dev:web. ודאו ש־MongoDB רץ וש־JWT_SECRET ב־server/.env.";
    }
    if (token && (res.status === 401 || res.status === 403)) clearToken();
    throw new ApiError(msg, res.status);
  }
  return json as T;
}

export type LoginResponse = { token: string; userId: string; status?: string; isNewUser?: boolean };

export type OtpRequestResponse = {
  message: string;
  expiresInSeconds: number;
  delivery?: "email" | "console";
  devCode?: string;
};

export function requestOtp(email: string) {
  return apiFetch<OtpRequestResponse>("/api/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuth: true,
  });
}

export function verifyOtp(email: string, code: string) {
  return apiFetch<LoginResponse>("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, code }),
    skipAuth: true,
  });
}

export type ServiceLifeCycle = "pre" | "serving" | "veteran";

import type { YomHameah as _YomHameah, YomHameah12Key as _YomHameah12Key } from "./yom-hameah-12";
export type YomHameah = _YomHameah;
export type YomHameah12Key = _YomHameah12Key;

export type YomQuestionnaireEntry = { questionId: string; score: number };

export type RegisterProfilePayload = {
  serviceLifeCycle: ServiceLifeCycle;
  preferredName?: string;
  draftDate?: string | null;
  dischargeDate?: string | null;
  serviceStartDate?: string | null;
  serviceEndDate?: string | null;
  daparScore?: number | null;
  medicalProfile?: number | null;
  yomHameah?: YomHameah | null;
  yomQuestionnaire?: YomQuestionnaireEntry[];
  yomHameahSource?: "official" | "self";
  preferences?: Partial<{
    combatPreference: string;
    schedule: string;
    focus: string;
    location: string;
    physicalActivityLevel: string;
  }>;
  phone?: string;
};

export type ScoreOnboardingPayload = {
  username: string;
  serviceLifeCycle?: ServiceLifeCycle;
  daparScore: number;
  medicalProfile: number;
  yomHameah: YomHameah;
  yomHameahSource: "official" | "self";
  /** yyyy-mm-dd — required for AI */
  draftDate: string;
  preferences: {
    combatPreference: string;
    focus: string;
    physicalActivityLevel: string;
    schedule?: string;
    location?: string;
  };
};

export function completeScoreOnboarding(payload: ScoreOnboardingPayload) {
  return updateProfile({
    user: {
      preferredName: payload.username,
      serviceLifeCycle: payload.serviceLifeCycle ?? "pre",
    },
    stats: {
      daparScore: payload.daparScore,
      medicalProfile: payload.medicalProfile,
      yomHameah: payload.yomHameah,
      draftDate: payload.draftDate,
    },
    preferences: {
      ...payload.preferences,
      yomHameahSource: payload.yomHameahSource,
    },
  });
}

export type MilitaryStatsDto = {
  draftDate?: string | null;
  dischargeDate?: string | null;
  serviceStartDate?: string | null;
  serviceEndDate?: string | null;
  daparScore?: number | null;
  medicalProfile?: number | null;
  yomHameah?: YomHameah | null;
  yomQuestionnaire?: YomQuestionnaireEntry[];
};

export type PreferencesDto = {
  combatPreference?: string;
  schedule?: string;
  focus?: string;
  location?: string;
  physicalActivityLevel?: string;
  yomHameahSource?: string;
};

export type DashboardResponse = {
  user: { email: string; preferredName?: string; phone?: string; status: string; createdAt?: string };
  stats: MilitaryStatsDto | null;
  preferences: PreferencesDto | null;
  daysRemaining: number | null;
  aiReady?: boolean;
  aiProfileMissing?: string[];
};

export function getDashboardStats() {
  return apiFetch<DashboardResponse>("/api/dashboard/stats");
}

export type ProfileUpdateBody = {
  status?: string;
  user?: {
    preferredName?: string;
    phone?: string;
    serviceLifeCycle?: ServiceLifeCycle;
  };
  stats?: Partial<{
    draftDate: string | null;
    dischargeDate: string | null;
    serviceStartDate: string | null;
    serviceEndDate: string | null;
    daparScore: number | null;
    medicalProfile: number | null;
    yomHameah: YomHameah | null;
    yomQuestionnaire: YomQuestionnaireEntry[];
  }>;
  preferences?: Partial<{
    combatPreference: string;
    schedule: string;
    focus: string;
    location: string;
    physicalActivityLevel: string;
    yomHameahSource: string;
  }>;
};

export function updateProfile(body: ProfileUpdateBody) {
  return apiFetch<{ message: string }>("/api/profile/update", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export type RoleMatch = {
  roleTitle: string;
  matchPercentage: number;
  /** One-line headline — from AI or derived from description */
  summary?: string;
  description: string;
  tags: string[];
};

export function matchRolesRequest() {
  return apiFetch<{ roles: RoleMatch[] }>("/api/ai/match-roles", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
