// 1. Read raw URL string from your process environment pipeline
const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 2. Production Resilient Prefix Builder Logic
const getSanitizedBaseUrl = (url: string): string => {
  // Remove any accidental trailing slashes first
  let cleanUrl = url.replace(/\/+$/, "");
  
  // Explicitly force the path prefix onto the engine stream if missing
  if (!cleanUrl.endsWith("/api/v1")) {
    cleanUrl = `${cleanUrl}/api/v1`;
  }
  
  return cleanUrl;
};

const BASE_URL = getSanitizedBaseUrl(RAW_URL);

console.log("OmniDocs Engine Hooked To API Channel:", BASE_URL);
export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface WorkspaceResponse {
  uuid: string;
  name: string;
  description: string;
  createdAt?: string;
}

export interface DocumentSummaryResponse {
  documentUuid: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const api = {
  // Accepts a nocache flag to force a direct, fresh fetch loop
  getAllWorkspaces: async (page = 0, size = 20, nocache = false): Promise<WorkspaceResponse[]> => {
    let url = `${BASE_URL}/workspaces?page=${page}&size=${size}&sort=createdAt,desc`;
    if (nocache) {
      url += `&_t=${Date.now()}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      }
    });
    const json = await res.json();
    return json.data?.content || [];
  },

  createWorkspace: async (request: CreateWorkspaceRequest): Promise<WorkspaceResponse> => {
    const res = await fetch(`${BASE_URL}/workspaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const json = await res.json();
    return json.data;
  },

  // Added dynamic cache busting to prevent old file quantities from remaining frozen
  getWorkspaceDocuments: async (workspaceUuid: string, page = 0, size = 20, nocache = false): Promise<PaginatedResponse<DocumentSummaryResponse>> => {
    let url = `${BASE_URL}/workspaces/${workspaceUuid}/documents?page=${page}&size=${size}`;
    if (nocache) {
      url += `&_t=${Date.now()}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      }
    });
    const json = await res.json();
    return json.data || { content: [], page: 0, size: size, totalElements: 0, totalPages: 0, last: true };
  },

  uploadDocument: async (workspaceUuid: string, file: File): Promise<unknown> => {
    const formData = new FormData();
    formData.append("workspaceUuid", workspaceUuid);
    formData.append("file", file);

    const res = await fetch(`${BASE_URL}/documents`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  processDocWithAI: async (docUuid: string): Promise<unknown> => {
    const res = await fetch(`${BASE_URL}/ai/documents/${docUuid}/process`, {
      method: "POST",
    });
    return res.json();
  },

  getTrashDocuments: async (page = 0, size = 50, nocache = false): Promise<PaginatedResponse<DocumentSummaryResponse>> => {
    // FIXED: Swapped out hardcoded localhost for the dynamic environment fallback variable
    let url = `${BASE_URL}/documents/deleted?page=${page}&size=${size}`;
    if (nocache) {
      url += `&_t=${Date.now()}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      }
    });
    const json = await res.json();
    
    // Unwraps the standard global structure cleanly
    return json.data || { content: [], page: 0, size: size, totalElements: 0, totalPages: 0, last: true };
  },
};