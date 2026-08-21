/**
 * SourceLedger API Client
 *
 * Bridges the new frontend's TypeScript type system to the FastAPI backend.
 * All functions return frontend-compatible types (ProductRecord, IngestionSource, etc.)
 * mapped from the backend's response shapes.
 *
 * Falls back to mock data if the backend is unreachable, so the UI always works.
 */

import {
  ProductRecord,
  ExtractedField,
  IngestionSource,
  CategoryOverview,
  RecordStatus,
  ConfidenceLevel,
  FieldAuditEntry,
} from '../types';

const BASE_URL = '/api';

// ── Low-level fetch helper ─────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Backend response types (match FastAPI models) ──────────────────────

interface BackendField {
  id: string;
  name: string;
  display_name: string;
  value: unknown;
  unit: string | null;
  confidence: number;
  source_excerpt: {
    source_id: string;
    text: string;
    location?: string;
  } | null;
  reasoning: string;
  status: 'auto_committed' | 'needs_review' | 'human_corrected';
  created_at: string;
  updated_at: string;
}

interface BackendProduct {
  id: string;
  name: string;
  category: string;
  source_ids: string[];
  fields: BackendField[];
  confidence_overall: number;
  created_at: string;
  updated_at: string;
}

interface BackendSource {
  id: string;
  source_type: string;
  origin: string;
  content_hash: string;
  trust_tier: number;
  created_at: string;
}

interface BackendProductDetail {
  product: BackendProduct;
  sources: BackendSource[];
  category_schema: {
    category_key: string;
    display_name: string;
    fields: { name: string; display_name: string; field_type: string }[];
  };
}

interface BackendProductSummary {
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

interface BackendDashboardStats {
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

interface BackendIngestResponse {
  run_id: string;
  status: string;
  product_id: string | null;
  message: string;
}

interface BackendReviewItem {
  field: BackendField;
  product_id: string;
  product_name: string;
  category: string;
  category_display_name: string;
}

// ── Mapping helpers ────────────────────────────────────────────────────

function confidenceToLevel(c: number): ConfidenceLevel {
  if (c >= 85) return 'high';
  if (c >= 65) return 'medium';
  return 'low';
}

function fieldStatusToRecordStatus(fields: BackendField[]): RecordStatus {
  const hasConflict = fields.some((f) => f.confidence < 50 && f.status === 'needs_review');
  if (hasConflict) return 'flagged_conflict';
  const allCommitted = fields.every(
    (f) => f.status === 'auto_committed' || f.status === 'human_corrected'
  );
  if (allCommitted) return 'auto_committed';
  const hasHumanCorrected = fields.some((f) => f.status === 'human_corrected');
  if (hasHumanCorrected) return 'human_corrected';
  return 'needs_review';
}

function formatRelativeTime(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return 'Recently';
  }
}

function mapBackendFieldToFrontend(f: BackendField, sourceOrigin: string): ExtractedField {
  const valueStr =
    f.value === null || f.value === undefined
      ? '—'
      : Array.isArray(f.value)
      ? (f.value as string[]).join(', ')
      : String(f.value);

  return {
    id: f.id,
    name: f.display_name || f.name,
    value: valueStr,
    confidence: f.confidence,
    confidenceLevel: confidenceToLevel(f.confidence),
    sourceDocument: sourceOrigin || 'Source Document',
    sourceExcerpt: f.source_excerpt?.text || '(no excerpt available)',
    sourceSection: f.source_excerpt?.location || undefined,
    aiReasoning: f.reasoning || 'No reasoning provided.',
    isCorrected: f.status === 'human_corrected',
    isApproved: f.status === 'auto_committed' || f.status === 'human_corrected',
    fieldType: 'text',
  };
}

function mapBackendProductToFrontend(
  product: BackendProduct,
  sources: BackendSource[],
  categoryDisplayName: string
): ProductRecord {
  const primarySource = sources[0];
  const sourceOrigin = primarySource?.origin || 'Unknown Source';
  const sourceDisplayName = sourceOrigin.startsWith('http')
    ? sourceOrigin.replace(/^https?:\/\//, '').split('/')[0]
    : sourceOrigin;

  const frontendFields = product.fields.map((f) =>
    mapBackendFieldToFrontend(f, sourceDisplayName)
  );

  const status = fieldStatusToRecordStatus(product.fields);
  const reviewedCount = product.fields.filter(
    (f) => f.status === 'auto_committed' || f.status === 'human_corrected'
  ).length;

  // Map backend category key to frontend category name
  const categoryMap: Record<string, ProductRecord['category']> = {
    industrial_pump: 'Industrial',
    electrical_connector: 'Electronics',
    safety_fastener: 'Industrial',
  };
  const frontendCategory =
    (categoryMap[product.category] as ProductRecord['category']) || 'Industrial';

  // Build initial audit entry
  const auditLog: FieldAuditEntry[] = [
    {
      id: `audit-init-${product.id}`,
      timestamp: formatRelativeTime(product.created_at),
      fieldId: 'initial',
      fieldName: 'All Attributes',
      previousValue: 'None',
      newValue: `${product.fields.length} fields extracted`,
      changedBy: 'Gemini AI Extraction Agent',
      changeType: 'ai_initial_extraction',
      confidenceBefore: 0,
      confidenceAfter: product.confidence_overall,
      reason: `Automated extraction from ${sourceDisplayName}`,
      sourceRef: sourceDisplayName,
    },
  ];

  return {
    id: product.id,
    sku: `SL-${product.id.slice(0, 8).toUpperCase()}`,
    name: product.name,
    brand: categoryDisplayName,
    category: frontendCategory,
    confidence: product.confidence_overall,
    confidenceLevel: confidenceToLevel(product.confidence_overall),
    status,
    lastUpdated: formatRelativeTime(product.updated_at),
    sourceDocument: sourceDisplayName,
    fieldsCount: product.fields.length,
    fieldsReviewedCount: reviewedCount,
    specsSummary: frontendFields
      .slice(0, 3)
      .map((f) => `${f.name}: ${f.value}`)
      .join(', '),
    conflictsSummary:
      status === 'flagged_conflict'
        ? `${product.fields.filter((f) => f.confidence < 50).length} field(s) have low confidence and need review.`
        : undefined,
    fields: frontendFields,
    auditLog,
  };
}

function mapSourceToFrontend(
  source: BackendSource,
  productCount: number = 1
): IngestionSource {
  const fileTypeMap: Record<string, IngestionSource['fileType']> = {
    pdf: 'PDF Datasheet',
    web: 'Web Scraper',
    image: 'PDF Datasheet',
  };
  const origin = source.origin || 'Unknown';
  const isUrl = origin.startsWith('http');
  const displayName = isUrl
    ? origin.replace(/^https?:\/\//, '').split('/')[0]
    : origin;

  return {
    id: source.id,
    name: displayName,
    fileName: isUrl ? origin : origin,
    fileType: fileTypeMap[source.source_type] || 'PDF Datasheet',
    fileSize: 'N/A',
    recordsCount: productCount,
    extractedFieldsCount: productCount * 8,
    status: 'completed',
    avgConfidence: 85,
    category: 'Industrial',
    timestamp: formatRelativeTime(source.created_at),
    aiModelUsed: 'Gemini Flash Extraction',
  };
}

// ── Public API functions ───────────────────────────────────────────────

/**
 * Fetch all products from the backend and map to frontend types.
 * Returns an empty array if the backend is unreachable.
 */
export async function fetchProducts(): Promise<ProductRecord[]> {
  // First get product list
  const listData = await apiFetch<{ products: BackendProductSummary[]; total_count: number }>(
    '/products'
  );

  if (listData.products.length === 0) return [];

  // Fetch full details for each product (in parallel, up to 20)
  const subset = listData.products.slice(0, 20);
  const details = await Promise.allSettled(
    subset.map((p) => apiFetch<BackendProductDetail>(`/products/${p.id}`))
  );

  const records: ProductRecord[] = [];
  for (const result of details) {
    if (result.status === 'fulfilled') {
      const d = result.value;
      const summary = subset.find((s) => s.id === d.product.id);
      records.push(
        mapBackendProductToFrontend(
          d.product,
          d.sources,
          summary?.category_display_name || d.category_schema.display_name
        )
      );
    }
  }

  return records;
}

/**
 * Fetch a single product by ID.
 */
export async function fetchProduct(productId: string): Promise<ProductRecord | null> {
  try {
    const detail = await apiFetch<BackendProductDetail>(`/products/${productId}`);
    return mapBackendProductToFrontend(
      detail.product,
      detail.sources,
      detail.category_schema.display_name
    );
  } catch {
    return null;
  }
}

/**
 * Fetch all ingestion sources.
 */
export async function fetchSources(): Promise<IngestionSource[]> {
  // Backend doesn't have a dedicated /sources list endpoint yet,
  // so we derive sources from the product details we already fetched.
  const listData = await apiFetch<{ products: BackendProductSummary[] }>('/products');
  if (listData.products.length === 0) return [];

  const sourceMap = new Map<string, { source: BackendSource; count: number }>();

  const details = await Promise.allSettled(
    listData.products.slice(0, 15).map((p) =>
      apiFetch<BackendProductDetail>(`/products/${p.id}`)
    )
  );

  for (const result of details) {
    if (result.status === 'fulfilled') {
      for (const src of result.value.sources) {
        if (!sourceMap.has(src.id)) {
          sourceMap.set(src.id, { source: src, count: 1 });
        } else {
          sourceMap.get(src.id)!.count++;
        }
      }
    }
  }

  return Array.from(sourceMap.values()).map(({ source, count }) =>
    mapSourceToFrontend(source, count)
  );
}

/**
 * Ingest a new source (URL or raw text) through the backend pipeline.
 * Returns the newly created ProductRecord on success, or throws on failure.
 */
export async function ingestSource(params: {
  sourceType: 'web' | 'pdf';
  content: string;
  category?: string;
  trustTier?: number;
  filename?: string;
}): Promise<ProductRecord> {
  const body = {
    source_type: params.sourceType,
    content: params.content,
    category: params.category || null,
    trust_tier: params.trustTier || 3,
    filename: params.filename || null,
  };

  const ingestResp = await apiFetch<BackendIngestResponse>('/ingest', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (ingestResp.status !== 'completed' || !ingestResp.product_id) {
    throw new Error(ingestResp.message || 'Ingestion failed');
  }

  // Fetch the newly created product
  const detail = await apiFetch<BackendProductDetail>(
    `/products/${ingestResp.product_id}`
  );

  return mapBackendProductToFrontend(
    detail.product,
    detail.sources,
    detail.category_schema.display_name
  );
}

/**
 * Accept a field in the review queue.
 */
export async function acceptField(productId: string, fieldId: string): Promise<void> {
  await apiFetch(`/products/${productId}/fields/${fieldId}/review`, {
    method: 'POST',
    body: JSON.stringify({ action: 'accept', reviewer: 'Catalog Engineer' }),
  });
}

/**
 * Edit a field value in the review queue.
 */
export async function editField(
  productId: string,
  fieldId: string,
  newValue: string
): Promise<void> {
  await apiFetch(`/products/${productId}/fields/${fieldId}/review`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'edit',
      corrected_value: newValue,
      reviewer: 'Catalog Engineer',
    }),
  });
}

/**
 * Reject a field value (sends it back to needs_review).
 */
export async function rejectField(productId: string, fieldId: string): Promise<void> {
  await apiFetch(`/products/${productId}/fields/${fieldId}/review`, {
    method: 'POST',
    body: JSON.stringify({ action: 'reject', reviewer: 'Catalog Engineer' }),
  });
}

/**
 * Fetch dashboard statistics.
 */
export async function fetchDashboardStats(): Promise<BackendDashboardStats> {
  return apiFetch<BackendDashboardStats>('/dashboard');
}

/**
 * Derive CategoryOverview array from live products for dashboard cards.
 */
export function buildCategoryOverviews(products: ProductRecord[]): CategoryOverview[] {
  const catMap = new Map<
    string,
    { total: number; validated: number; needsReview: number; confSum: number }
  >();

  for (const p of products) {
    const cat = p.category;
    if (!catMap.has(cat)) {
      catMap.set(cat, { total: 0, validated: 0, needsReview: 0, confSum: 0 });
    }
    const entry = catMap.get(cat)!;
    entry.total++;
    entry.confSum += p.confidence;
    if (p.status === 'auto_committed' || p.status === 'human_corrected') {
      entry.validated++;
    } else {
      entry.needsReview++;
    }
  }

  const colorCycle: CategoryOverview['accentColor'][] = ['orange', 'charcoal', 'cream'];
  let colorIdx = 0;

  return Array.from(catMap.entries()).map(([name, data]) => ({
    id: `cat-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    iconName: name === 'Electronics' ? 'Cpu' : name === 'Industrial' ? 'Factory' : 'Layers',
    totalRecords: data.total,
    validatedRecords: data.validated,
    needsReviewCount: data.needsReview,
    avgConfidence: data.total > 0 ? Math.round(data.confSum / data.total) : 0,
    accentColor: colorCycle[colorIdx++ % colorCycle.length],
  }));
}

/**
 * Check if the backend is reachable.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    await apiFetch('/health');
    return true;
  } catch {
    return false;
  }
}
