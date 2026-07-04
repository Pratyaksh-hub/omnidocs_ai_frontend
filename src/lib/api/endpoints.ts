const RAW_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

const normalize = (url: string): string => {
  const cleaned = url.replace(/\/+$/, "");

  return cleaned.endsWith("/api/v1")
    ? cleaned
    : `${cleaned}/api/v1`;
};

export const BASE_URL = normalize(RAW_URL);

export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
  },

  USERS: {
    ME: "/users/me",
  },

  DASHBOARD: "/dashboard",

  WORKSPACES: {
    ROOT: "/workspaces",
    BY_ID: (id: string) => `/workspaces/${id}`,
    DOCUMENTS: (id: string) =>
      `/workspaces/${id}/documents`,
    RENAME: (id: string) =>
      `/workspaces/${id}/rename`,
  },

  DOCUMENTS: {
    ROOT: "/documents",
    BY_ID: (id: string) => `/documents/${id}`,
    RENAME: (id: string) =>
      `/documents/${id}/rename`,
    RESTORE: (id: string) =>
      `/documents/${id}/restore`,
    PERMANENT_DELETE: (id: string) =>
      `/documents/${id}/permanent`,
    DELETED: "/documents/deleted",
  },

  AI: {
    PROCESS_DOCUMENT: (id: string) =>
      `/ai/documents/${id}/process`,
    CHAT: (id: string) =>
      `/ai/workspaces/${id}/chat`,
  },
} as const;