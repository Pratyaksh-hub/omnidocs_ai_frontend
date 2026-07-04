/* ============================================================
 * Common API Response Types
 * ============================================================
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiErrorResponse | null;
}

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  code?: string | null;
  message?: string;
  path?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/* ============================================================
 * Authentication
 * ============================================================
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;

  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;

  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;

  userUuid: string;

  firstName: string;
  lastName: string;

  email: string;

  role: string;
}

/* ============================================================
 * User
 * ============================================================
 */

export interface UserProfile {
  userUuid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserProfileResponse {
  userUuid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
}

export interface UserProfileResponse {
  userUuid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
}

/* ============================================================
 * Dashboard
 * ============================================================
 */

export interface DashboardMetrics {
  totalWorkspaces: number;
  totalDocuments: number;
}

/* ============================================================
 * Workspace
 * ============================================================
 */

export interface Workspace {
  uuid: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface WorkspaceResponse {
  uuid: string;
  name: string;
  description: string;
  createdAt?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface RenameWorkspaceRequest {
  name: string;
}

/* ============================================================
 * Documents
 * ============================================================
 */

export interface DocumentSummary {
  documentUuid: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

export interface RenameDocumentRequest {
  name: string;
}

export interface DocumentSummaryResponse {
  documentUuid: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

/* ============================================================
 * AI
 * ============================================================
 */

export interface AskWorkspaceRequest {
  question: string;
}

export interface AskWorkspaceResponse {
  answer: string;
}

/* ============================================================
 * Security Pool
 * ============================================================
 */

export interface SecurityPool {
  poolUuid: string;

  name: string;

  description: string;

  associatedWorkspacesCount: number;

  piiRedactionActive: boolean;

  allowedRoleTier:
    | "USER"
    | "ADMIN"
    | "SYSTEM_ROOT";

  totalEmbeddedVectors: number;

  createdAt: string;
}

export interface SecurityPoolItem {
  poolUuid: string;
  name: string;
  description: string;
  associatedWorkspacesCount: number;
  piiRedactionActive: boolean;
  allowedRoleTier: "USER" | "ADMIN" | "SYSTEM_ROOT";
  totalEmbeddedVectors: number;
  createdAt: string;
}