// 1. Read raw URL string from your process environment pipeline
const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 2. Production Resilient Prefix Builder Logic
const getSanitizedBaseUrl = (url: string): string => {
  let cleanUrl = url.replace(/\/+$/, "");
  if (!cleanUrl.endsWith("/api/v1")) {
    cleanUrl = `${cleanUrl}/api/v1`;
  }
  return cleanUrl;
};

export const BASE_URL = getSanitizedBaseUrl(RAW_URL);

console.log("OmniDocs Engine Hooked To API Channel:", BASE_URL);

// --- CENTRALIZED ERROR & RESPONSE INTERCEPTION UTILITY ---

export interface BackendErrorPayload {
  success: boolean;
  data: null;
  error?: {
    timestamp?: string;
    status?: number;
    error?: string;
    code?: string | null;
    message?: string;
    path?: string;
  };
}

/**
 * Extracts exact structured backend error messages or formats network transport anomalies.
 */
export async function handleCentralizedError(errorContext: unknown): Promise<Error> {
  if (errorContext instanceof Response) {
    if (errorContext.status === 404) {
      return new Error("404 Not Found: The authentication target endpoint could not be found on the remote server cluster.");
    }
    if (errorContext.status === 401 || errorContext.status === 403) {
      return new Error(`${errorContext.status} Unauthorized: Access denied by security compliance filters.`);
    }

    try {
      const responseJson = await errorContext.clone().json() as BackendErrorPayload;
      if (responseJson?.error?.message) {
        return new Error(responseJson.error.message);
      }
      if (responseJson?.error?.error) {
        return new Error(responseJson.error.error);
      }
    } catch {
      // Stream is not valid JSON or text body fallback
    }
    return new Error(`HTTP Error ${errorContext.status}: An error occurred while communicating with the engine endpoint.`);
  }

  if (errorContext instanceof Error) {
    const msg = errorContext.message.toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("network error")) {
      return new Error("CORS Policy or Network Failure: Connection blocked by cross-origin security resource filters.");
    }
    return errorContext;
  }

  return new Error("Something went wrong. Please check your data or network connection.");
}

// --- TYPE INTERFACES ---

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface WorkspaceResponse {
  uuid: string;
  name: string;
  description: string;
  createdAt?: string;
}

export interface DocumentSummaryResponse {
  documentUuid: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  firstName: string;
  lastName: string;
  userUuid: string;
  role: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface DashboardResponse {
  totalWorkspaces: number;
  totalDocuments: number;
}

export interface UserProfileResponse {
  userUuid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
}

export interface SecurityPoolItem {
  poolUuid: string;
  name: string;
  description: string;
  associatedWorkspacesCount: number;
  piiRedactionActive: boolean;
  allowedRoleTier: "USER" | "ADMIN" | "SYSTEM_ROOT";
  totalEmbeddedVectors: number;
  createdAt: string;
}

// --- CORE LIFECYCLE BACKGROUND CONTROLLERS ---

let isRefreshingTokens = false;
let failedQueueWaiters: ((error: Error | null, token: string | null) => void)[] = [];
let activeRefreshTimeoutId: NodeJS.Timeout | null = null;

const processQueueWaiters = (error: Error | null, token: string | null = null) => {
  failedQueueWaiters.forEach((callback) => callback(error, token));
  failedQueueWaiters = [];
};

const handleForcedSessionLogout = () => {
  if (activeRefreshTimeoutId) clearTimeout(activeRefreshTimeoutId);
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("access_token_expires_at");
  if (typeof window !== "undefined") {
    window.location.href = "/auth";
  }
};

export const proactiveTokenRefreshTrigger = () => {
  if (typeof window === "undefined") return;

  if (activeRefreshTimeoutId) {
    clearTimeout(activeRefreshTimeoutId);
    activeRefreshTimeoutId = null;
  }

  const expiresAtStr = localStorage.getItem("access_token_expires_at");
  if (!expiresAtStr) return;

  const expirationTimeMs = new Date(expiresAtStr).getTime();
  if (isNaN(expirationTimeMs)) return;

  const bufferMs = 60 * 1000;
  const currentTimeMs = Date.now();
  const delayTimeMs = expirationTimeMs - currentTimeMs - bufferMs;

  console.log(`⏱️ Token Lifecycle Monitor: Next background refresh scheduled in ${Math.max(0, delayTimeMs / 1000)} seconds.`);

  activeRefreshTimeoutId = setTimeout(async () => {
    console.log("🔄 Proactive lifecycle refresh boundary crossed. Syncing keys...");
    try {
      await authApi.executeDirectSilentTokenRefresh();
    } catch (err) {
      console.error("Proactive session refresh sequence fell through:", err);
    }
  }, Math.max(0, delayTimeMs));
};

// --- TRANSPARENT REQUEST INTERCEPTOR FLIGHT LAYER ---
export const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  
  options.headers = {
    ...options.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (networkError) {
    throw await handleCentralizedError(networkError);
  }

  if (response.status === 401) {
    if (typeof window === "undefined") return response;
    
    const storedRefreshKey = localStorage.getItem("refresh_token");
    if (!storedRefreshKey) {
      handleForcedSessionLogout();
      return response;
    }

    if (isRefreshingTokens) {
      return new Promise((resolve, reject) => {
        failedQueueWaiters.push((err: Error | null, newAccessToken: string | null) => {
          if (err) {
            reject(err);
          } else {
            if (options.headers) {
              (options.headers as Record<string, string>)["Authorization"] = `Bearer ${newAccessToken}`;
            }
            resolve(fetch(url, options));
          }
        });
      });
    }

    try {
      const newKeys = await authApi.executeDirectSilentTokenRefresh();
      if (options.headers) {
        (options.headers as Record<string, string>)["Authorization"] = `Bearer ${newKeys.accessToken}`;
      }
      return await fetch(url, options);
    } catch (refreshError) {
      handleForcedSessionLogout();
      throw refreshError;
    }
  }

  if (!response.ok) {
    throw await handleCentralizedError(response);
  }

  return response;
};

// --- AUTHENTICATION UTILITY OBJECT ---

export const authApi = {
  executeDirectSilentTokenRefresh: async (): Promise<AuthResponse> => {
    const storedRefreshKey = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!storedRefreshKey) throw new Error("No refresh token cached");

    isRefreshingTokens = true;
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshKey })
      });

      if (!res.ok) throw await handleCentralizedError(res);

      const json = await res.json();
      const newKeys: AuthResponse = json.data;

      localStorage.setItem("access_token", newKeys.accessToken);
      localStorage.setItem("refresh_token", newKeys.refreshToken);
      localStorage.setItem("access_token_expires_at", newKeys.accessTokenExpiresAt);

      processQueueWaiters(null, newKeys.accessToken);
      proactiveTokenRefreshTrigger();
      
      return newKeys;
    } catch (err) {
      const formattedError = await handleCentralizedError(err);
      processQueueWaiters(formattedError, null);
      throw formattedError;
    } finally {
      isRefreshingTokens = false;
    }
  },

  login: async (request: LoginRequest): Promise<AuthResponse> => {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
    } catch (netErr) {
      throw await handleCentralizedError(netErr);
    }

    if (!res.ok) throw await handleCentralizedError(res);
    const json = await res.json();
    const authData: AuthResponse = json.data;

    localStorage.setItem("access_token", authData.accessToken);
    localStorage.setItem("refresh_token", authData.refreshToken);
    localStorage.setItem("access_token_expires_at", authData.accessTokenExpiresAt);
    
    setTimeout(() => proactiveTokenRefreshTrigger(), 0);
    
    return authData;
  },

  logout: async (): Promise<void> => {
    if (activeRefreshTimeoutId) clearTimeout(activeRefreshTimeoutId);
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ refreshToken: refreshToken || "" }),
      });
    } catch (err) {
      console.error("Logout notification network error:", err);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("access_token_expires_at");
    }
  },
  
  signup: async (request: SignupRequest): Promise<AuthResponse> => {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
    } catch (netErr) {
      throw await handleCentralizedError(netErr);
    }

    if (!res.ok) throw await handleCentralizedError(res);
    const json = await res.json();
    return json.data || { accessToken: "", refreshToken: "", email: request.email };
  },
};

// --- CORE APPLICATION METRICS & AGENTS (USING SECUREFETCH) ---

export const api = {
  getAllWorkspaces: async (page = 0, size = 20, nocache = false): Promise<WorkspaceResponse[]> => {
    let url = `${BASE_URL}/workspaces?page=${page}&size=${size}&sort=createdAt,desc`;
    if (nocache) url += `&_t=${Date.now()}`;

    const res = await secureFetch(url, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      }
    });
    const json = await res.json();
    return json.data?.content || [];
  },

  createWorkspace: async (request: CreateWorkspaceRequest): Promise<WorkspaceResponse> => {
    const res = await secureFetch(`${BASE_URL}/workspaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const json = await res.json();
    return json.data;
  },

  getWorkspaceDocuments: async (workspaceUuid: string, page = 0, size = 20, nocache = false): Promise<PaginatedResponse<DocumentSummaryResponse>> => {
    let url = `${BASE_URL}/workspaces/${workspaceUuid}/documents?page=${page}&size=${size}`;
    if (nocache) url += `&_t=${Date.now()}`;

    const res = await secureFetch(url, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      }
    });
    const json = await res.json();
    return json.data || { content: [], page: 0, size: size, totalElements: 0, totalPages: 0, last: true };
  },

  uploadDocument: async (workspaceUuid: string, file: File): Promise<unknown> => {
    const formData = new FormData();
    formData.append("workspaceUuid", workspaceUuid);
    formData.append("file", file);

    const res = await secureFetch(`${BASE_URL}/documents`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  processDocWithAI: async (docUuid: string): Promise<unknown> => {
    const res = await secureFetch(`${BASE_URL}/ai/documents/${docUuid}/process`, {
      method: "POST",
    });
    return res.json();
  },

  getTrashDocuments: async (page = 0, size = 50, nocache = false): Promise<PaginatedResponse<DocumentSummaryResponse>> => {
    let url = `${BASE_URL}/documents/deleted?page=${page}&size=${size}`;
    if (nocache) url += `&_t=${Date.now()}`;

    const res = await secureFetch(url, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      }
    });
    const json = await res.json();
    return json.data || { content: [], page: 0, size: size, totalElements: 0, totalPages: 0, last: true };
  },

  getDashboardMetrics: async (nocache = false): Promise<DashboardResponse> => {
    let url = `${BASE_URL}/dashboard`;
    if (nocache) url += `?_t=${Date.now()}`;

    const res = await secureFetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });

    const json = await res.json();
    return json.data || { totalWorkspaces: 0, totalDocuments: 0 };
  },

  renameWorkspace: async (workspaceUuid: string, newName: string): Promise<WorkspaceResponse> => {
    const res = await secureFetch(`${BASE_URL}/workspaces/${workspaceUuid}/rename`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    const json = await res.json();
    return json.data;
  },

  deleteDocument: async (documentUuid: string): Promise<void> => {
    await secureFetch(`${BASE_URL}/documents/${documentUuid}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
  },

  getDeletedDocuments: async (page = 0, size = 50): Promise<{ content: DocumentSummaryResponse[] }> => {
    const res = await secureFetch(`${BASE_URL}/documents/deleted?page=${page}&size=${size}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    return await res.json();
  },

  renameDocument: async (documentUuid: string, newName: string): Promise<DocumentSummaryResponse> => {
    const res = await secureFetch(`${BASE_URL}/documents/${documentUuid}/rename`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const json = await res.json();
    return json.data;
  },

  restoreDocument: async (documentUuid: string): Promise<DocumentSummaryResponse> => {
    const res = await secureFetch(`${BASE_URL}/documents/${documentUuid}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const json = await res.json();
    return json.data;
  },

  permanentDeleteDocument: async (documentUuid: string): Promise<void> => {
    await secureFetch(`${BASE_URL}/documents/${documentUuid}/permanent`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
  },

  getCurrentUser: async (): Promise<UserProfileResponse> => {
    const res = await secureFetch(`${BASE_URL}/users/me`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    const json = await res.json();
    return json.data;
  },

  askWorkspaceAI: async (workspaceUuid: string, question: string): Promise<{ answer: string }> => {
    const res = await secureFetch(`${BASE_URL}/ai/workspaces/${workspaceUuid}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question.trim() }),
    });
    const json = await res.json();
    return json.data; // Expecting backend structure like: { success: true, data: { answer: "..." } }
  },
};