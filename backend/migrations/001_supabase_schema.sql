-- SourceLedger — Supabase Postgres Schema (Fully Idempotent Migration)
-- Run this once in Supabase Dashboard → SQL Editor → New query → Run
-- All tables store the full Pydantic model as JSONB in the `data` column
-- with indexed lookup columns for fast filtering.

-- ── 1. Sources Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
    id            TEXT PRIMARY KEY,
    content_hash  TEXT,
    data          JSONB NOT NULL,
    user_id       TEXT NOT NULL DEFAULT 'default_user',
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sources ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default_user';
CREATE INDEX IF NOT EXISTS idx_sources_user_id     ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_hash_user   ON sources(content_hash, user_id);

-- ── 2. Products Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id           TEXT PRIMARY KEY,
    category     TEXT,
    name         TEXT,
    confidence   INTEGER,
    data         JSONB NOT NULL,
    user_id      TEXT NOT NULL DEFAULT 'default_user',
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default_user';
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- ── 3. Review Actions Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_actions (
    id         TEXT PRIMARY KEY,
    product_id TEXT,
    data       JSONB NOT NULL,
    user_id    TEXT NOT NULL DEFAULT 'default_user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE review_actions ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default_user';
CREATE INDEX IF NOT EXISTS idx_review_actions_user    ON review_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_actions_product ON review_actions(product_id);

-- ── 4. Field Conflicts Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS field_conflicts (
    id         TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    data       JSONB NOT NULL,
    user_id    TEXT NOT NULL DEFAULT 'default_user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE field_conflicts ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default_user';
CREATE INDEX IF NOT EXISTS idx_field_conflicts_user    ON field_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_field_conflicts_product ON field_conflicts(product_id);

-- ── 5. Product Relationships Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_relationships (
    id                TEXT PRIMARY KEY,
    source_sku        TEXT NOT NULL,
    target_sku        TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    confidence        INTEGER NOT NULL,
    data              JSONB NOT NULL,
    user_id           TEXT NOT NULL DEFAULT 'default_user',
    created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE product_relationships ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default_user';
CREATE INDEX IF NOT EXISTS idx_product_rel_user ON product_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_product_rel_skus ON product_relationships(source_sku, target_sku);

-- ── 6. Correction Patterns Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS correction_patterns (
    id           TEXT PRIMARY KEY,
    category     TEXT NOT NULL,
    field_name   TEXT NOT NULL,
    manufacturer TEXT,
    data         JSONB NOT NULL,
    user_id      TEXT NOT NULL DEFAULT 'default_user',
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE correction_patterns ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'default_user';

-- ── 7. User Profiles Table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id    TEXT PRIMARY KEY,
    data       JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. Row Level Security (RLS) ──────────────────────────────────────────────
ALTER TABLE sources               ENABLE ROW LEVEL SECURITY;
ALTER TABLE products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_actions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_conflicts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_patterns   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
