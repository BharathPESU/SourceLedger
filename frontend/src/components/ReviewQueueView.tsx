import React, { useState } from 'react';
import { 
  CheckSquare, 
  Filter, 
  Check, 
  X, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Search, 
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { ProductRecord } from '../types';
import { StatusPill } from './StatusPill';

interface ReviewQueueViewProps {
  products: ProductRecord[];
  onSelectProduct: (product: ProductRecord) => void;
  onApproveProduct: (productId: string) => void;
  onApproveAll: (productIds: string[]) => void;
  onNavigateToTab: (tab: any) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  products,
  onSelectProduct,
  onApproveProduct,
  onApproveAll,
  onNavigateToTab
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [confidenceTier, setConfidenceTier] = useState<'all' | 'critical' | 'moderate'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const queueProducts = products.filter(p => {
    // category filter
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    // confidence tier filter
    if (confidenceTier === 'critical' && p.confidence >= 65 && p.status !== 'flagged_conflict') return false;
    if (confidenceTier === 'moderate' && (p.confidence < 65 || p.confidence >= 85)) return false;
    // search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    }
    return true;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === queueProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(queueProducts.map(p => p.id));
    }
  };

  const handleBulkApprove = () => {
    onApproveAll(selectedIds);
    setSelectedIds([]);
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Glass Card */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-[#E8622C] text-xs font-bold uppercase tracking-wider mb-2 border border-white/70 shadow-2xs">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Human-in-the-Loop Validation</span>
          </div>
          <h1 className="font-didone font-bold text-2xl sm:text-3xl text-[#191715] tracking-tight">
            Catalog <span className="font-didone-italic text-[#E8622C] font-normal">Review Queue</span>
          </h1>
          <p className="text-sm text-[#5C554D] mt-1 max-w-xl">
            Triage attributes where model certainty was below 85% or where conflicting specification values were detected across datasheets.
          </p>
        </div>

        {/* Quick batch statistics */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-2xs text-center min-w-[100px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
              In Queue
            </span>
            <span className="font-display font-bold text-xl text-[#191715]">
              {queueProducts.length}
            </span>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-[#FEF2F2]/80 backdrop-blur-md border border-[#FECACA]/70 shadow-2xs text-center min-w-[100px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C53030] block">
              Conflicts
            </span>
            <span className="font-display font-bold text-xl text-[#C53030]">
              {products.filter(p => p.status === 'flagged_conflict').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Batch Actions Bar - Frosted Glass Card */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.04)] flex flex-wrap items-center justify-between gap-4">
        {/* Left: Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8C8276] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by product or SKU..."
              className="bg-white/60 backdrop-blur-md text-xs text-[#191715] pl-8 pr-3 py-2 rounded-xl border border-white/70 focus:outline-hidden focus:border-[#E8622C] w-48 sm:w-56 shadow-2xs placeholder:text-[#8C8276]"
            />
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

          <div className="flex items-center bg-white/60 backdrop-blur-md p-1 rounded-xl border border-white/70 shadow-2xs text-xs">
            <button
              onClick={() => setConfidenceTier('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                confidenceTier === 'all' ? 'bg-[#191715] text-white shadow-xs' : 'text-[#5C554D] hover:text-[#191715]'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setConfidenceTier('critical')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                confidenceTier === 'critical' ? 'bg-[#E8622C] text-white shadow-xs' : 'text-[#5C554D] hover:text-[#191715]'
              }`}
            >
              Conflicts & &lt;65%
            </button>
            <button
              onClick={() => setConfidenceTier('moderate')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                confidenceTier === 'moderate' ? 'bg-[#262320] text-white shadow-xs' : 'text-[#5C554D] hover:text-[#191715]'
              }`}
            >
              65% - 85%
            </button>
          </div>
        </div>

        {/* Right: Bulk Action Controls */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#E8622C] to-[#D45320] hover:scale-[1.02] text-white text-xs font-bold shadow-md shadow-[#E8622C]/25 border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Approve Selected ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              const highConfIds = products.filter(p => p.confidence >= 80 && p.status !== 'auto_committed').map(p => p.id);
              if (highConfIds.length > 0) onApproveAll(highConfIds);
            }}
            className="px-4 py-2 rounded-full bg-white/70 hover:bg-white/95 backdrop-blur-md text-[#191715] text-xs font-bold border border-white/70 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8622C]" />
            <span>Auto-Approve &gt;80%</span>
          </button>
        </div>
      </div>

      {/* Borderless Table of Items in Review Queue - Frosted Glass Card */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.05)] overflow-hidden">
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-[#8C8276] border-b border-white/60">
                <th className="py-3 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === queueProducts.length && queueProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-white/80 text-[#E8622C] focus:ring-[#E8622C] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Product Name & SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">AI Confidence</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Pending Attributes</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/60">
              {queueProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-[#1F8A53] mb-2" />
                      <p className="font-bold text-sm text-[#191715]">Review Queue Clear</p>
                      <p className="text-xs text-[#8C8276] mt-0.5">No products or fields currently require human review.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                queueProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id);

                return (
                  <tr
                    key={product.id}
                    className={`group transition-colors cursor-pointer ${
                      isSelected ? 'bg-white/90 backdrop-blur-md' : 'hover:bg-white/60 hover:backdrop-blur-md'
                    }`}
                    onClick={() => {
                      onSelectProduct(product);
                      onNavigateToTab('field_inspector');
                    }}
                  >
                    {/* Checkbox */}
                    <td className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(product.id)}
                        className="rounded border-white/80 text-[#E8622C] focus:ring-[#E8622C] cursor-pointer"
                      />
                    </td>

                    {/* Product Name & Brand */}
                    <td className="py-4 px-3">
                      <div className="min-w-0 max-w-[280px]">
                        <div className="font-semibold text-sm text-[#191715] group-hover:text-[#E8622C] transition-colors">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#8C8276] mt-0.5 font-mono">
                          <span>{product.sku}</span>
                          <span>•</span>
                          <span className="font-sans font-semibold text-[#5C554D]">{product.brand}</span>
                        </div>
                        {product.conflictsSummary && (
                          <p className="text-[11px] text-[#C53030] font-medium mt-1 truncate max-w-xs">
                            {product.conflictsSummary}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-3">
                      <span className="text-xs font-medium text-[#5C554D] bg-white/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/70 shadow-2xs">
                        {product.category}
                      </span>
                    </td>

                    {/* AI Confidence Bar & Numeral */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-white/60 h-2 rounded-full overflow-hidden border border-white/40">
                          <div
                            className={`h-full rounded-full ${
                              product.confidence >= 85
                                ? 'bg-[#E8622C]'
                                : product.confidence >= 65
                                ? 'bg-[#262320]'
                                : 'bg-[#C53030]'
                            }`}
                            style={{ width: `${product.confidence}%` }}
                          />
                        </div>
                        <span className="font-display font-bold text-xs text-[#191715]">
                          {product.confidence}%
                        </span>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="py-4 px-3">
                      <StatusPill
                        type="status"
                        status={product.status}
                        size="sm"
                      />
                    </td>

                    {/* Fields Reviewed */}
                    <td className="py-4 px-3 text-xs text-[#5C554D]">
                      <span className="font-semibold text-[#191715]">
                        {product.fieldsReviewedCount}
                      </span> / {product.fieldsCount} fields verified
                    </td>

                    {/* Inline Actions */}
                    <td className="py-4 px-3 text-right">
                      <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onApproveProduct(product.id)}
                          className="px-3 py-1.5 rounded-full bg-white/70 hover:bg-[#EAF5EE]/90 text-[#191715] hover:text-[#1F8A53] text-xs font-bold border border-white/70 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Accept and Commit"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => {
                            onSelectProduct(product);
                            onNavigateToTab('field_inspector');
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-[#191715] hover:bg-[#E8622C] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
