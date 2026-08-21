import React, { useState } from 'react';
import { 
  Boxes, 
  Search, 
  Download, 
  ExternalLink, 
  SlidersHorizontal, 
  Sparkles, 
  Eye, 
  ArrowUpDown,
  FileSpreadsheet,
  CheckCircle2,
  X,
  SearchX
} from 'lucide-react';
import { ProductRecord } from '../types';
import { StatusPill } from './StatusPill';
import { SvgProgressRing } from './SvgProgressRing';

interface ProductsCatalogViewProps {
  products: ProductRecord[];
  onSelectProduct: (product: ProductRecord) => void;
  onNavigateToTab: (tab: any) => void;
}

// Reusable Highlight component to visually emphasize query matches
const HighlightMatch: React.FC<{ text: string; query: string; className?: string }> = ({
  text,
  query,
  className = '',
}) => {
  if (!text) return null;
  const trimmed = query.trim();
  if (!trimmed) {
    return <span className={className}>{text}</span>;
  }

  // Safely escape special regex characters
  const escapedQuery = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-[#E8622C]/20 text-[#191715] font-extrabold px-1 py-0.5 rounded-sm ring-1 ring-[#E8622C]/30 shadow-2xs inline-block"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </span>
  );
};

export const ProductsCatalogView: React.FC<ProductsCatalogViewProps> = ({
  products,
  onSelectProduct,
  onNavigateToTab
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'confidence_desc' | 'confidence_asc' | 'name'>('confidence_desc');

  const categories = Array.from(new Set(products.map(p => p.category)));

  // Calculate overall catalog health and auto-commit completion metrics
  const avgHealth = Math.round(
    products.reduce((acc, p) => acc + p.confidence, 0) / (products.length || 1)
  );
  const autoCommittedCount = products.filter(p => p.status === 'auto_committed').length;
  const completionPercent = Math.round((autoCommittedCount / (products.length || 1)) * 100);

  const trimmedSearch = search.trim();

  const filteredProducts = products.filter(p => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (trimmedSearch) {
      const q = trimmedSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.specsSummary && p.specsSummary.toLowerCase().includes(q))
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'confidence_desc') return b.confidence - a.confidence;
    if (sortBy === 'confidence_asc') return a.confidence - b.confidence;
    return a.name.localeCompare(b.name);
  });

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["SKU,Name,Brand,Category,Confidence,Status,Source"].join(",") + "\n"
      + filteredProducts.map(p => `"${p.sku}","${p.name}","${p.brand}","${p.category}",${p.confidence},"${p.status}","${p.sourceDocument}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sourceledger_catalog_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Glass Card */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-[#E8622C] text-xs font-bold uppercase tracking-wider mb-2 border border-white/70 shadow-2xs">
            <Boxes className="w-3.5 h-3.5" />
            <span>Master Catalog Ledger</span>
          </div>
          <h1 className="font-didone font-bold text-2xl sm:text-3xl text-[#191715] tracking-tight">
            Product Records <span className="font-didone-italic text-[#E8622C] font-normal">Catalog</span>
          </h1>
          <p className="text-sm text-[#5C554D] mt-1 max-w-xl">
            Browse all ingested records with canonical specifications, multimodal provenance references, and field-level confidence scores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Catalog Health & Completion Status SVG Ring Pill */}
          <div className="px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/80 shadow-2xs flex items-center gap-3">
            <SvgProgressRing
              value={avgHealth}
              size={40}
              strokeWidth={4}
              glow={avgHealth >= 85}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8276]">
                  Catalog Health
                </span>
                <CheckCircle2 className="w-3 h-3 text-[#1F8A53]" />
              </div>
              <span className="text-xs font-bold text-[#191715] block">
                {completionPercent}% Verified & Committed
              </span>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-full bg-white/70 hover:bg-white/95 backdrop-blur-md text-[#191715] text-xs font-bold border border-white/70 shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#E8622C]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar - Frosted Glass Card */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.04)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input with Clear Button and Live Match Indicator */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8C8276] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog by name, SKU, or specs..."
              className="bg-white/60 backdrop-blur-md text-xs text-[#191715] pl-8 pr-8 py-2 rounded-xl border border-white/70 focus:outline-hidden focus:border-[#E8622C] w-64 sm:w-72 shadow-2xs placeholder:text-[#8C8276]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/5 text-[#8C8276] hover:text-[#191715] transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/60 backdrop-blur-md text-xs font-semibold text-[#191715] px-3 py-2 rounded-xl border border-white/70 shadow-2xs focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/60 backdrop-blur-md text-xs font-semibold text-[#191715] px-3 py-2 rounded-xl border border-white/70 shadow-2xs focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="auto_committed">Auto-Committed</option>
            <option value="needs_review">Needs Review</option>
            <option value="flagged_conflict">Flagged Conflict</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8C8276] font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white/60 backdrop-blur-md text-xs font-bold text-[#191715] px-3 py-1.5 rounded-xl border border-white/70 shadow-2xs focus:outline-hidden cursor-pointer"
          >
            <option value="confidence_desc">Highest Confidence</option>
            <option value="confidence_asc">Lowest Confidence</option>
            <option value="name">Product Name</option>
          </select>
        </div>
      </div>

      {/* Active Search & Filter Feedback Banner */}
      {trimmedSearch && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-white/50 backdrop-blur-md border border-white/70 text-xs text-[#5C554D]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E8622C] animate-pulse" />
            <span>
              Found <strong className="text-[#191715] font-bold">{filteredProducts.length}</strong> matching records for <mark className="bg-[#E8622C]/20 text-[#191715] font-bold px-1.5 py-0.5 rounded-md">"{trimmedSearch}"</mark>
            </span>
          </div>
          <button
            onClick={() => setSearch('')}
            className="text-[#E8622C] hover:underline font-bold text-xs cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Product Catalog Grid / Frosted Glass Cards */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => {
                onSelectProduct(product);
                onNavigateToTab('field_inspector');
              }}
              className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.04)] hover:shadow-lg hover:border-[#E8622C]/40 hover:bg-white/85 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/60 backdrop-blur-md text-[#5C554D] border border-white/70 shadow-2xs">
                    <HighlightMatch text={product.sku} query={trimmedSearch} />
                  </span>
                  <StatusPill type="status" status={product.status} size="sm" />
                </div>

                <h3 className="font-display font-bold text-base text-[#191715] group-hover:text-[#E8622C] transition-colors leading-snug">
                  <HighlightMatch text={product.name} query={trimmedSearch} />
                </h3>

                <p className="text-xs text-[#8C8276] mt-1 font-semibold">
                  <HighlightMatch text={product.brand} query={trimmedSearch} /> • <HighlightMatch text={product.category} query={trimmedSearch} />
                </p>

                <p className="text-xs text-[#5C554D] mt-2.5 line-clamp-2 leading-relaxed">
                  <HighlightMatch text={product.specsSummary} query={trimmedSearch} />
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/60 flex items-center justify-between">
                {/* Stylized SVG Progress Ring replacing standard plain percentage label */}
                <div className="flex items-center gap-2.5">
                  <SvgProgressRing
                    value={product.confidence}
                    size={34}
                    strokeWidth={3.5}
                    glow={product.confidence >= 85}
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8276]">
                      Health
                    </span>
                    <span className="text-xs font-bold text-[#191715] -mt-0.5">
                      {product.confidence >= 90
                        ? 'Optimal'
                        : product.confidence >= 85
                        ? 'Verified'
                        : product.confidence >= 70
                        ? 'Review'
                        : 'Conflict'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-[#E8622C] group-hover:translate-x-1 transition-transform">
                  <span>Inspect</span>
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty Search Results State */
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-12 text-center border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.04)] max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF4EB] text-[#E8622C] flex items-center justify-center mx-auto mb-4 border border-[#DFCDBC]/50">
            <SearchX className="w-7 h-7" />
          </div>
          <h3 className="font-didone font-bold text-xl text-[#191715]">
            No Matching Products Found
          </h3>
          <p className="text-xs text-[#5C554D] mt-1.5 leading-relaxed">
            No catalog records matched your search query <strong className="text-[#191715]">"{trimmedSearch}"</strong>. Try checking for typos or resetting your active category and status filters.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => setSearch('')}
              className="px-4 py-2 rounded-xl bg-[#E8622C] text-white text-xs font-bold shadow-xs hover:bg-[#D45320] transition-colors cursor-pointer"
            >
              Clear Search Query
            </button>
            {(categoryFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-white/80 text-[#191715] text-xs font-bold border border-white/80 hover:bg-white transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

