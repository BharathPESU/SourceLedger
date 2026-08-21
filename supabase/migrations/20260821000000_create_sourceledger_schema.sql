-- SourceLedger Supabase Database Schema Migration
-- Target Organization: sourceLedge
-- Target Project: SourceLedger Production Catalog

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ingestion Sources Table
CREATE TABLE IF NOT EXISTS public.ingestion_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'PDF',
    file_name TEXT NOT NULL,
    file_size TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    records_count INTEGER NOT NULL DEFAULT 0,
    extracted_fields_count INTEGER NOT NULL DEFAULT 0,
    avg_confidence DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ai_model_used TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Master Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'needs_review',
    confidence INTEGER NOT NULL DEFAULT 0,
    confidence_level TEXT NOT NULL DEFAULT 'medium',
    fields_count INTEGER NOT NULL DEFAULT 0,
    fields_reviewed_count INTEGER NOT NULL DEFAULT 0,
    source_document TEXT,
    conflicts_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 3. Product Extracted Attributes / Fields Table
CREATE TABLE IF NOT EXISTS public.product_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    value JSONB,
    confidence INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'needs_review',
    source_excerpt JSONB,
    reasoning TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    is_corrected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_fields_product_id ON public.product_fields(product_id);
CREATE INDEX IF NOT EXISTS idx_product_fields_name ON public.product_fields(name);

-- 4. Audit Log Table (NFR-3 Provenance Compliance)
CREATE TABLE IF NOT EXISTS public.agent_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    query TEXT,
    response JSONB,
    source_url TEXT,
    confidence INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_calls_agent ON public.agent_calls(agent_name);

-- 5. Row Level Security (RLS) Policies for Public Read & Service Role Writes
ALTER TABLE public.ingestion_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_calls ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access for catalog viewer
CREATE POLICY "Allow public read access to products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to product_fields" ON public.product_fields
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to ingestion_sources" ON public.ingestion_sources
    FOR SELECT USING (true);

-- Allow authenticated and service role full control
CREATE POLICY "Allow service role full access to products" ON public.products
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to product_fields" ON public.product_fields
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to ingestion_sources" ON public.ingestion_sources
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to agent_calls" ON public.agent_calls
    USING (true) WITH CHECK (true);
