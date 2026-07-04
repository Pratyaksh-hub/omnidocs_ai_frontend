type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

class ApiCache {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  private readonly DEFAULT_TTL = 5 * 60 * 1000;

  constructor() {
    if (typeof window !== "undefined") {
      setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
  ): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.inFlight.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }

    for (const key of this.inFlight.keys()) {
      if (key.startsWith(prefix)) {
        this.inFlight.delete(key);
      }
    }
  }

  async remember<T>(
    key: string,
    supplier: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const existing = this.inFlight.get(key);

    if (existing) {
      return existing as Promise<T>;
    }

    const promise = supplier()
      .then((value) => {
        this.set(key, value, ttl);
        return value;
      })
      .catch((err) => {
        // PRODUCTION FIX: If the promise rejects, delete it from the in-flight map 
        // immediately so subsequent retry rendering frames don't inherit a broken promise track
        this.inFlight.delete(key);
        throw err;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);

    return promise;
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  invalidate(keys: string[]): void {
    for (const key of keys) {
      this.delete(key);
    }
  }

  rememberForever<T>(
    key: string,
    supplier: () => Promise<T>,
  ): Promise<T> {
    return this.remember(
      key,
      supplier,
      Number.MAX_SAFE_INTEGER,
    );
  }

  touch(
    key: string,
    ttl: number = this.DEFAULT_TTL,
  ): void {
    const entry = this.cache.get(key);

    if (!entry) {
      return;
    }

    entry.expiresAt = Date.now() + ttl;

    this.cache.set(key, entry);
  }

  size(): number {
    return this.cache.size;
  }
}

export const apiCache = new ApiCache();

export const CacheKeys = {
  CURRENT_USER: "current-user",

  DASHBOARD: "dashboard",

  WORKSPACES: "workspaces",

  WORKSPACE: (id: string) =>
    `workspace:${id}`,

  DOCUMENTS: (
    workspaceId: string,
    page: number,
    size: number,
  ) => `documents:${workspaceId}:${page}:${size}`,

  TRASH: (
    page: number,
    size: number,
  ) => `trash:${page}:${size}`,
} as const;