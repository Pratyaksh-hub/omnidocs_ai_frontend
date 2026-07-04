import { apiCache, CacheKeys } from "./cache";
import { apiClient } from "./client";
import { ENDPOINTS } from "./endpoints";

import type { UserProfile } from "./types";

const USER_CACHE_TTL = 10 * 60 * 1000;

class UserApi {
  async getCurrentUser(
    forceRefresh = false,
  ): Promise<UserProfile> {
    const key = CacheKeys.CURRENT_USER;

    if (forceRefresh) {
      apiCache.delete(key);
    }

    return apiCache.remember<UserProfile>(
      key,
      () =>
        apiClient.get<UserProfile>(
          ENDPOINTS.USERS.ME,
        ),
      USER_CACHE_TTL,
    );
  }

  async refresh(): Promise<UserProfile> {
    return this.getCurrentUser(true);
  }

  invalidate(): void {
    apiCache.delete(CacheKeys.CURRENT_USER);
  }

  async updateCache(user: UserProfile): Promise<void> {
    apiCache.set(
      CacheKeys.CURRENT_USER,
      user,
      USER_CACHE_TTL,
    );
  }

  getCachedUser(): UserProfile | null {
    return apiCache.get<UserProfile>(
      CacheKeys.CURRENT_USER,
    );
  }

  isCached(): boolean {
    return apiCache.has(
      CacheKeys.CURRENT_USER,
    );
  }

  clear(): void {
    apiCache.delete(
      CacheKeys.CURRENT_USER,
    );
  }
}

export const userApi = new UserApi();