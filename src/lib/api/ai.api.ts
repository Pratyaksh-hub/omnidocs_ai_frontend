import { apiClient } from "./client";
import { ENDPOINTS } from "./endpoints";

import type {
  AskWorkspaceRequest,
  AskWorkspaceResponse,
} from "./types";

class AiApi {
  async askWorkspace(
    workspaceId: string,
    question: string,
  ): Promise<AskWorkspaceResponse> {
    return apiClient.post<AskWorkspaceResponse>(
      ENDPOINTS.AI.CHAT(workspaceId),
      {
        question: question.trim(),
      } satisfies AskWorkspaceRequest,
    );
  }

  async processDocument(
    documentId: string,
  ): Promise<void> {
    await apiClient.post<void>(
      ENDPOINTS.AI.PROCESS_DOCUMENT(
        documentId,
      ),
    );
  }
}

export const aiApi = new AiApi();