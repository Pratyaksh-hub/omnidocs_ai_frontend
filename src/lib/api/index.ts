import { apiClient } from "./client";

export * from "./types";
export * from "./errors";

export { apiClient } from "./client";
export { apiCache } from "./cache";

export { authApi } from "./auth.api";
export { workspaceApi } from "./workspace.api";
export { documentApi } from "./document.api";
export { dashboardApi } from "./dashboard.api";
export { userApi } from "./user.api";
export { aiApi } from "./ai.api";
export { ENDPOINTS } from "./endpoints";

export const secureFetch = (input: string, init?: RequestInit) => 
  apiClient.secureFetch(input, init);