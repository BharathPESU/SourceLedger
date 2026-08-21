/**
 * TypeScript types mirroring the backend Pydantic schemas.
 *
 * These are the frontend's view of the data model. They must stay
 * in sync with backend/src/models/ — any drift means the UI shows
 * stale or wrong data.
 */

// ── Enums ──────────────────────────────────────────────────────────

export type FieldStatus = "auto_committed" | "needs_review" | "human_corrected";
export type SourceType = "pdf" | "web" | "image";
export type ReviewActionType = "accept" | "edit" | "reject";

// ── Core Entities ──────────────────────────────────────────────────

export interface SourceExcerpt {
  source_id: string;
  text: string;
  location: string | null;
}

export interface Source {
  id: string;
  source_type: SourceType;
  origin: string;
  raw_content_ref: string;
  content_hash: string;
  trust_tier: number;
  title: string | null;
  created_at: string;
}

export interface ProductField {
  id: string;
  name: string;
  display_name: string;
  value: unknown;
  unit: string | null;
  confidence: number;
  source_excerpt: SourceExcerpt;
  reasoning: string;
  status: FieldStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductRecord {
  id: string;
  name: string;
  category: string;
  schema_version: string;
  fields: ProductField[];
  source_ids: string[];
  confidence_overall: number;
  taxonomy_code: string | null;
  dedup_cluster_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewAction {
  id: string;
  field_id: string;
  product_id: string;
  action: ReviewActionType;
  original_value: unknown;
  corrected_value: unknown;
  reviewer: string;
  timestamp: string;
}

// ── Category Schema ────────────────────────────────────────────────

export interface CategoryFieldDef {
  name: string;
  display_name: string;
  field_type: string;
  unit: string | null;
  required: boolean;
  description: string;
  examples: string[];
}

export interface CategorySchema {
  category_key: string;
  display_name: string;
  version: string;
  description: string;
  fields: CategoryFieldDef[];
}

// ── API Responses ──────────────────────────────────────────────────

export interface IngestRequest {
  source_type: SourceType;
  content: string;
  category?: string;
  filename?: string;
  trust_tier?: number;
}

export interface IngestResponse {
  run_id: string;
  status: "processing" | "completed" | "failed";
  product_id: string | null;
  message: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  category: string;
  category_display_name: string;
  confidence_overall: number;
  field_count: number;
  needs_review_count: number;
  auto_committed_count: number;
  created_at: string;
}

export interface ProductListResponse {
  products: ProductSummary[];
  total_count: number;
}

export interface ProductDetailResponse {
  product: ProductRecord;
  sources: Source[];
  category_schema: CategorySchema;
}

export interface FieldInspectResponse {
  field: ProductField;
  source_document: Source;
  source_excerpt_text: string;
  source_excerpt_location: string | null;
  reasoning: string;
  confidence: number;
  status: FieldStatus;
  alternatives: FieldAlternative[];
}

export interface FieldAlternative {
  value: unknown;
  source_id: string;
  source_origin: string;
  trust_tier: number;
  confidence: number;
  excerpt: string;
}

export interface ReviewQueueItem {
  field: ProductField;
  product_id: string;
  product_name: string;
  category: string;
  category_display_name: string;
}

export interface ReviewQueueResponse {
  items: ReviewQueueItem[];
  total_count: number;
}

export interface ReviewActionRequest {
  action: ReviewActionType;
  corrected_value?: unknown;
  reviewer?: string;
}

export interface ReviewActionResponse {
  review_action: ReviewAction;
  updated_field: ProductField;
}

export interface DashboardStats {
  total_records: number;
  total_fields: number;
  auto_committed_count: number;
  needs_review_count: number;
  human_corrected_count: number;
  auto_committed_pct: number;
  needs_review_pct: number;
  average_confidence: number;
  confidence_by_category: Record<string, number>;
  records_by_category: Record<string, number>;
}

export interface CategoryListResponse {
  categories: CategorySchema[];
}
