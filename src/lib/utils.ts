import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BackendErrorPayload {
  success: boolean;
  data: null;
  error?: {
    timestamp?: string;
    status?: number;
    error?: string;
    code?: string | null;
    message?: string;
    path?: string;
  };
}

/**
 * Parses raw application catch instances and extracts structured backend error text.
 */
export async function handleCentralizedError(errorContext: unknown): Promise<string> {
  // Pass errors directly if they have already been formatted
  if (errorContext instanceof Error) {
    const messageLower = errorContext.message.toLowerCase();
    if (messageLower.includes("failed to fetch") || messageLower.includes("network error")) {
      return "CORS Policy or Network Isolation: Remote cluster connection dropped or blocked.";
    }
    return errorContext.message;
  }

  // Handle Response stream objects thrown directly by fetch filters
  if (errorContext instanceof Response) {
    if (errorContext.status === 404) {
      return "404 Not Found: The requested resource path does not exist on the server instance.";
    }
    if (errorContext.status === 401 || errorContext.status === 403) {
      return `${errorContext.status} Unauthorized: Access rejected by authorization security filters.`;
    }

    try {
      const responseJson = await errorContext.json() as BackendErrorPayload;
      if (responseJson?.error?.message) {
        return responseJson.error.message;
      }
      if (responseJson?.error?.error) {
        return responseJson.error.error;
      }
    } catch {
      // Fallback if response payload stream cannot be unpacked
    }
    return `HTTP Transport Error ${errorContext.status}: Transaction failed.`;
  }

  return "Something went wrong. Please check your data or network connection.";
}