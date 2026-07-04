import { BASE_URL } from "./endpoints";
import { parseApiError, UnauthorizedError } from "./errors";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeout?: number;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT = 30000;

class ApiClient {
  private refreshPromise: Promise<void> | null = null;

  private async getAccessToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }

  private async getRefreshToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refresh_token");
  }

  public saveTokens(payload: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
  }) {
    if (typeof window === "undefined") return;

    localStorage.setItem("access_token", payload.accessToken);
    localStorage.setItem("refresh_token", payload.refreshToken);
    localStorage.setItem(
      "access_token_expires_at",
      payload.accessTokenExpiresAt,
    );
  }

  public clearSession() {
    if (typeof window === "undefined") return;

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("access_token_expires_at");

    window.location.href = "/auth";
  }

  public async refreshToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const refreshToken = await this.getRefreshToken();

      if (!refreshToken) {
        throw new UnauthorizedError();
      }

      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      if (!response.ok) {
        throw await parseApiError(response);
      }

      const json = await response.json();

      this.saveTokens(json.data);
    })();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async execute<T>(
    url: string,
    options: RequestOptions,
    retry = true,
  ): Promise<T> {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, options.timeout ?? DEFAULT_TIMEOUT);

    try {
      const headers = new Headers(options.headers);

      if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }

      if (!options.skipAuth) {
        const token = await this.getAccessToken();

        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
        body:
          options.body instanceof FormData
            ? options.body
            : options.body != null
              ? JSON.stringify(options.body)
              : undefined,
        signal: controller.signal,
      });

      if (response.status === 401 && retry && !options.skipAuth) {
        try {
          await this.refreshToken();

          return this.execute<T>(url, options, false);
        } catch {
          this.clearSession();
          throw new UnauthorizedError();
        }
      }

      if (!response.ok) {
        throw await parseApiError(response);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const json = await response.json();

      return json.data as T;
    } catch (error) {
      throw await parseApiError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T>(url: string, options?: RequestOptions) {
    return this.execute<T>(
      url,
      {
        ...options,
        method: "GET",
      },
    );
  }

  post<T>(
    url: string,
    body?: unknown,
    options?: RequestOptions,
  ) {
    return this.execute<T>(
      url,
      {
        ...options,
        method: "POST",
        body,
      },
    );
  }

  put<T>(
    url: string,
    body?: unknown,
    options?: RequestOptions,
  ) {
    return this.execute<T>(
      url,
      {
        ...options,
        method: "PUT",
        body,
      },
    );
  }

  patch<T>(
    url: string,
    body?: unknown,
    options?: RequestOptions,
  ) {
    return this.execute<T>(
      url,
      {
        ...options,
        method: "PATCH",
        body,
      },
    );
  }

  delete<T>(
    url: string,
    options?: RequestOptions,
  ) {
    return this.execute<T>(
      url,
      {
        ...options,
        method: "DELETE",
      },
    );
  }

  upload<T>(
    url: string,
    formData: FormData,
    options?: RequestOptions,
  ) {
    return this.execute<T>(
      url,
      {
        ...options,
        method: "POST",
        body: formData,
      },
    );
  }

  // Exposed utility hook to safely bind global legacy fetch patterns directly to backend clients
  public async secureFetch(url: string, options?: RequestInit): Promise<Response> {
    const headers = new Headers(options?.headers);
    const token = await this.getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(`${BASE_URL}${url}`, {
      ...options,
      headers
    });
  }
}

export const apiClient = new ApiClient();