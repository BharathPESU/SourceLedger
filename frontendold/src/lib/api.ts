/**
 * API client for SourceLedger backend.
 *
 * All backend communication goes through these functions.
 * Base URL defaults to localhost:8000 for development.
 */

import type {
  CategoryListResponse,
  DashboardStats,
  FieldInspectResponse,
  IngestRequest,
  IngestResponse,
  ProductDetailResponse,
  ProductListResponse,
  ReviewActionRequest,
  ReviewActionResponse,
  ReviewQueueResponse,
} from "./types";

const BASE_URL = "http://localhost:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// ── Ingestion ──────────────────────────────────────────────────────

export function ingestSource(data: IngestRequest): Promise<IngestResponse> {
  return request("/ingest", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Products ───────────────────────────────────────────────────────

export function listProducts(): Promise<ProductListResponse> {
  return request("/products");
}

export function getProduct(id: string): Promise<ProductDetailResponse> {
  return request(`/products/${id}`);
}

// ── Field Inspector ────────────────────────────────────────────────

export function inspectField(
  productId: string,
  fieldId: string
): Promise<FieldInspectResponse> {
  return request(`/products/${productId}/fields/${fieldId}/inspect`);
}

// ── Review Queue ───────────────────────────────────────────────────

export function getReviewQueue(): Promise<ReviewQueueResponse> {
  return request("/review");
}

export function reviewField(
  productId: string,
  fieldId: string,
  action: ReviewActionRequest
): Promise<ReviewActionResponse> {
  return request(`/products/${productId}/fields/${fieldId}/review`, {
    method: "POST",
    body: JSON.stringify(action),
  });
}

// ── Dashboard ──────────────────────────────────────────────────────

export function getDashboardStats(): Promise<DashboardStats> {
  return request("/dashboard");
}

// ── Categories ─────────────────────────────────────────────────────

export function getCategories(): Promise<CategoryListResponse> {
  return request("/categories");
}
