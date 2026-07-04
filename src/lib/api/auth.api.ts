import { apiClient } from "./client";
import { apiCache } from "./cache";
import { ENDPOINTS } from "./endpoints";
import { CacheKeys } from "./cache";

import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  UserProfile,
} from "./types";

class AuthApi {
  async login(request: LoginRequest): Promise<AuthResponse> {
    apiCache.clear();

    const response = await apiClient.post<AuthResponse>(
      ENDPOINTS.AUTH.LOGIN,
      request,
      {
        skipAuth: true,
      },
    );

    apiClient.saveTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      accessTokenExpiresAt: response.accessTokenExpiresAt,
    });

    // PRODUCTION FIX: Pre-hydrate the context user instance out of login parameters 
    // to stop the security gate from making immediate twin profiling calls to the backend
    const userProfileMock: UserProfile = {
      userUuid: response.userUuid,
      firstName: response.firstName,
      lastName: response.lastName,
      email: response.email,
      role: response.role,
      active: true,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    apiCache.set(CacheKeys.CURRENT_USER, userProfileMock, 15 * 60 * 1000);

    // Evacuate transient structures
    apiCache.delete(CacheKeys.DASHBOARD);
    apiCache.invalidatePrefix(CacheKeys.WORKSPACES);

    return response;
  }

  async signup(request: SignupRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(
      ENDPOINTS.AUTH.SIGNUP,
      request,
      {
        skipAuth: true,
      },
    );
  }

  async logout(): Promise<void> {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refresh_token")
        : null;

    try {
      await apiClient.post<void>(
        ENDPOINTS.AUTH.LOGOUT,
        {
          refreshToken,
        },
      );
    } catch (err) {
      console.error("Logout propagation encountered anomalies:", err);
    } finally {
      apiCache.clear();

      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("access_token_expires_at");

        window.location.href = "/auth";
      }
    }
  }

  isAuthenticated(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    return !!localStorage.getItem("access_token");
  }

  getAccessToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("access_token");
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("refresh_token");
  }
}

export const authApi = new AuthApi();