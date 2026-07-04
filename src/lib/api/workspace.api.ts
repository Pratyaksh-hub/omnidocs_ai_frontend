import { apiCache, CacheKeys } from "./cache";
import { apiClient } from "./client";
import { ENDPOINTS } from "./endpoints";

import type {
  CreateWorkspaceRequest,
  DocumentSummary,
  PageResponse,
  RenameWorkspaceRequest,
  Workspace,
} from "./types";

const WORKSPACE_TTL = 5 * 60 * 1000;

class WorkspaceApi {
  async getAllWorkspaces(
    page = 0,
    size = 20,
    forceRefresh = false,
  ): Promise<Workspace[]> {
    const key = `${CacheKeys.WORKSPACES}:${page}:${size}`;

    if (forceRefresh) {
      apiCache.delete(key);
    }

    const response = await apiCache.remember<PageResponse<Workspace>>(
      key,
      () =>
        apiClient.get<PageResponse<Workspace>>(
          `${ENDPOINTS.WORKSPACES.ROOT}?page=${page}&size=${size}&sort=createdAt,desc`,
        ),
      WORKSPACE_TTL,
    );

    return response?.content || [];
  }

  async getWorkspaceDocuments(
    workspaceId: string,
    page = 0,
    size = 20,
    forceRefresh = false,
  ): Promise<PageResponse<DocumentSummary>> {
    const key = CacheKeys.DOCUMENTS(
      workspaceId,
      page,
      size,
    );

    if (forceRefresh) {
      apiCache.delete(key);
    }

    return apiCache.remember<PageResponse<DocumentSummary>>(
      key,
      () =>
        apiClient.get<PageResponse<DocumentSummary>>(
          `${ENDPOINTS.WORKSPACES.DOCUMENTS(
            workspaceId,
          )}?page=${page}&size=${size}`,
        ),
      WORKSPACE_TTL,
    );
  }

  async createWorkspace(
    request: CreateWorkspaceRequest,
  ): Promise<Workspace> {
    const workspace = await apiClient.post<Workspace>(
      ENDPOINTS.WORKSPACES.ROOT,
      request,
    );

    apiCache.invalidatePrefix(CacheKeys.WORKSPACES);
    apiCache.delete(CacheKeys.DASHBOARD);

    return workspace;
  }

  async renameWorkspace(
    workspaceId: string,
    name: string,
  ): Promise<Workspace> {
    const workspace = await apiClient.patch<Workspace>(
      ENDPOINTS.WORKSPACES.RENAME(workspaceId),
      {
        name: name.trim(),
      } satisfies RenameWorkspaceRequest,
    );

    apiCache.invalidatePrefix(CacheKeys.WORKSPACES);
    apiCache.invalidatePrefix(CacheKeys.WORKSPACE(workspaceId));

    return workspace;
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await apiClient.delete<void>(
      ENDPOINTS.WORKSPACES.BY_ID(workspaceId),
    );

    apiCache.invalidatePrefix(CacheKeys.WORKSPACES);
    apiCache.invalidatePrefix(CacheKeys.WORKSPACE(workspaceId));
    apiCache.invalidatePrefix(`documents:${workspaceId}`);
    apiCache.delete(CacheKeys.DASHBOARD);
  }
}

export const workspaceApi = new WorkspaceApi();