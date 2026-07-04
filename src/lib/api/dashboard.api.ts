import { apiCache, CacheKeys } from "./cache";
import { apiClient } from "./client";
import { ENDPOINTS } from "./endpoints";

import type { DashboardMetrics } from "./types";

const DASHBOARD_TTL = 60 * 1000;

class DashboardApi {
  async getMetrics(forceRefresh = false): Promise<DashboardMetrics> {
    const key = CacheKeys.DASHBOARD;

    if (forceRefresh) {
      apiCache.delete(key);
    }

    return apiCache.remember<DashboardMetrics>(
      key,
      () =>
        apiClient.get<DashboardMetrics>(
          ENDPOINTS.DASHBOARD,
        ),
      DASHBOARD_TTL,
    );
  }

  invalidate(): void {
    apiCache.delete(CacheKeys.DASHBOARD);
  }

  async refresh(): Promise<DashboardMetrics> {
    return this.getMetrics(true);
  }
}

export const dashboardApi = new DashboardApi();