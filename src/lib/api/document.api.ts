import { apiCache, CacheKeys } from "./cache";
import { apiClient } from "./client";
import { ENDPOINTS } from "./endpoints";

import type {
  DocumentSummary,
  PageResponse,
  RenameDocumentRequest,
} from "./types";

const DOCUMENT_TTL = 5 * 60 * 1000;

class DocumentApi {
  async uploadDocument(
    workspaceId: string,
    file: File,
  ): Promise<DocumentSummary> {
    const formData = new FormData();

    formData.append("workspaceUuid", workspaceId);
    formData.append("file", file);

    const response = await apiClient.upload<DocumentSummary>(
      ENDPOINTS.DOCUMENTS.ROOT,
      formData,
    );

    // Evacuate listing structures to enforce fresh data re-hydration on layout swap
    apiCache.invalidatePrefix(`documents:${workspaceId}`);
    apiCache.delete(CacheKeys.DASHBOARD);

    return response;
  }

  async renameDocument(
    documentId: string,
    name: string,
  ): Promise<DocumentSummary> {
    const response = await apiClient.patch<DocumentSummary>(
      ENDPOINTS.DOCUMENTS.RENAME(documentId),
      {
        name: name.trim(),
      } satisfies RenameDocumentRequest,
    );

    apiCache.invalidatePrefix("documents:");
    apiCache.invalidatePrefix("trash:");
    apiCache.delete(CacheKeys.DASHBOARD);

    return response;
  }

  async deleteDocument(documentId: string): Promise<void> {
    await apiClient.delete<void>(
      ENDPOINTS.DOCUMENTS.BY_ID(documentId),
    );

    apiCache.invalidatePrefix("documents:");
    apiCache.invalidatePrefix("trash:");
    apiCache.delete(CacheKeys.DASHBOARD);
  }

  async restoreDocument(documentId: string): Promise<DocumentSummary> {
    const response = await apiClient.post<DocumentSummary>(
      ENDPOINTS.DOCUMENTS.RESTORE(documentId),
    );

    apiCache.invalidatePrefix("documents:");
    apiCache.invalidatePrefix("trash:");
    apiCache.delete(CacheKeys.DASHBOARD);

    return response;
  }

  async permanentDeleteDocument(documentId: string): Promise<void> {
    await apiClient.delete<void>(
      ENDPOINTS.DOCUMENTS.PERMANENT_DELETE(documentId),
    );

    apiCache.invalidatePrefix("trash:");
    apiCache.delete(CacheKeys.DASHBOARD);
  }

  async getDeletedDocuments(
    page = 0,
    size = 20,
    forceRefresh = false,
  ): Promise<PageResponse<DocumentSummary>> {
    const key = CacheKeys.TRASH(page, size);

    if (forceRefresh) {
      apiCache.delete(key);
    }

    return apiCache.remember<PageResponse<DocumentSummary>>(
      key,
      () =>
        apiClient.get<PageResponse<DocumentSummary>>(
          `${ENDPOINTS.DOCUMENTS.DELETED}?page=${page}&size=${size}`,
        ),
      DOCUMENT_TTL,
    );
  }

  async processWithAI(documentId: string): Promise<void> {
    await apiClient.post<void>(
      ENDPOINTS.AI.PROCESS_DOCUMENT(documentId),
    );

    apiCache.delete(CacheKeys.DASHBOARD);
  }
}

export const documentApi = new DocumentApi();