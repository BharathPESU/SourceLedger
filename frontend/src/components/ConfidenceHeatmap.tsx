import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Cpu, 
  Factory, 
  Headphones, 
  Bot, 
  Lightbulb, 
  HeartPulse, 
  ShieldAlert, 
  SlidersHorizontal, 
  Layers, 
  Eye, 
  Activity,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ProductRecord, CategoryOverview } from '../types';
import { SvgProgressRing } from './SvgProgressRing';

interface CategoryHeatmapData {
  id: string;
  name: string;
  categoryKey: string;
  icon: React.ReactNode;
  totalSkus: number;
  avgConfidence: number;
  needsReviewCount: number;
  autoCommittedCount: number;
  urgencyLevel: 'critical' | 'attention' | 'healthy' | 'optimal';
  urgencyScore: number; // 0-100 (higher means more urgent)
  topDiscrepancy: string;
  recentSampleSku?: string;
  recentSampleName?: string;
  recentSampleProduct?: ProductRecord;
}

interface ConfidenceHeatmapProps {
  products: ProductRecord[];
  categories: CategoryOverview[];
  onSelectProduct?: (product: ProductRecord) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const ConfidenceHeatmap: React.FC<ConfidenceHeatmapProps> = ({
  products,
  categories,
  onSelectProduct,
  onNavigateToTab
}) => {
  const [sortBy, setSortBy] = useState<'urgency' | 'confidence_asc' | 'records_desc'>('urgency');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);

  // Icon mapping helper
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('electronic') || lower.includes('chip') || lower.includes('semiconductor')) {
      return <Cpu className="w-4 h-4" />;
    }
    if (lower.includes('industrial') || lower.includes('sensor') || lower.includes('automation')) {
      return <Factory className="w-4 h-4" />;
    }
    if (lower.includes('audio') || lower.includes('acoustic') || lower.includes('sound')) {
      return <Headphones className="w-4 h-4" />;
    }
    if (lower.includes('robotic') || lower.includes('motion') || lower.includes('servo')) {
      return <Bot className="w-4 h-4" />;
    }
    if (lower.includes('light') || lower.includes('optic') || lower.includes('luminaire')) {
      return <Lightbulb className="w-4 h-4" />;
    }
    if (lower.includes('med') || lower.includes('bio') || lower.includes('health')) {
      return <HeartPulse className="w-4 h-4" />;
    }
    return <Layers className="w-4 h-4" />;
  };

  // Compile dynamic heatmap metrics — derived entirely from REAL products
  const heatmapData = useMemo<CategoryHeatmapData[]>(() => {
    if (products.length === 0) return [];

    // Group products by their actual category
    const catGroups = new Map<string, ProductRecord[]>();
    for (const p of products) {
      const cat = p.category || 'Uncategorized';
      if (!catGroups.has(cat)) catGroups.set(cat, []);
      catGroups.get(cat)!.push(p);
    }

    return Array.from(catGroups.entries()).map(([catName, catProducts]) => {
      const count = catProducts.length;
      const sumConf = catProducts.reduce((acc, p) => acc + p.confidence, 0);
      const avgConf = +(sumConf / count).toFixed(1);
      const reviewCount = catProducts.filter(p => p.status === 'needs_review' || p.status === 'flagged_conflict').length;
      const autoCount = catProducts.filter(p => p.status === 'auto_committed' || p.status === 'human_corrected').length;
      const sampleProduct = catProducts.find(p => p.status === 'needs_review' || p.status === 'flagged_conflict') || catProducts[0];

      // Calculate urgency
      const reviewRatio = reviewCount / count;
      const confidencePenalty = Math.max(0, 100 - avgConf);
      const urgencyScore = Math.min(100, Math.round(confidencePenalty * 0.7 + reviewRatio * 100 * 0.3));

      let urgencyLevel: CategoryHeatmapData['urgencyLevel'] = 'optimal';
      if (avgConf < 75 || urgencyScore >= 60) {
        urgencyLevel = 'critical';
      } else if (avgConf < 85 || urgencyScore >= 35) {
        urgencyLevel = 'attention';
      } else if (avgConf < 92) {
        urgencyLevel = 'healthy';
      }

      // Find top discrepancy from flagged fields
      const conflictProduct = catProducts.find(p => p.conflictsSummary);
      const topDiscrepancy = conflictProduct?.conflictsSummary || 
        (reviewCount > 0 ? `${reviewCount} product(s) pending human verification` : 'All fields verified');

      return {
        id: `cat-${catName.toLowerCase().replace(/\s+/g, '-')}`,
        name: catName,
        categoryKey: catName,
        icon: getCategoryIcon(catName),
        totalSkus: count,
        avgConfidence: avgConf,
        needsReviewCount: reviewCount,
        autoCommittedCount: autoCount,
        urgencyLevel,
        urgencyScore,
        topDiscrepancy,
        recentSampleSku: sampleProduct?.sku,
        recentSampleName: sampleProduct?.name,
        recentSampleProduct: sampleProduct,
      };
    }).sort((a, b) => {
      if (sortBy === 'urgency') return b.urgencyScore - a.urgencyScore;
      if (sortBy === 'confidence_asc') return a.avgConfidence - b.avgConfidence;
      if (sortBy === 'records_desc') return b.totalSkus - a.totalSkus;
      return 0;
    });
  }, [products, categories, sortBy]);

  // Styling helper for the heatmap tiles
  const getTileStyles = (level: CategoryHeatmapData['urgencyLevel'], avgConf: number) => {
    switch (level) {
      case 'critical':
        return {
          cardBg: 'bg-gradient-to-br from-[#FFF0ED] via-[#FAF4EB] to-white/90',
          border: 'border-[#D45320]/40 hover:border-[#D45320]',
          ring: 'ring-1 ring-[#D45320]/20',
          badgeBg: 'bg-[#D45320] text-white',
          accentText: 'text-[#D45320]',
          barColor: 'bg-[#D45320]',
          heatLabel: 'Critical Attention',
          heatGradient: 'from-[#D45320]/20 to-transparent',
          pulse: true
        };
      case 'attention':
        return {
          cardBg: 'bg-gradient-to-br from-[#FFFDF0] via-[#FAF4EB] to-white/90',
          border: 'border-[#D97706]/40 hover:border-[#D97706]',
          ring: 'ring-1 ring-[#D97706]/20',
          badgeBg: 'bg-[#D97706] text-white',
          accentText: 'text-[#D97706]',
          barColor: 'bg-[#D97706]',
          heatLabel: 'Needs Verification',
          heatGradient: 'from-[#D97706]/20 to-transparent',
          pulse: false
        };
      case 'healthy':
        return {
          cardBg: 'bg-gradient-to-br from-[#F5FBF7] via-[#FAF4EB] to-white/90',
          border: 'border-[#1F8A53]/30 hover:border-[#1F8A53]',
          ring: 'ring-1 ring-[#1F8A53]/15',
          badgeBg: 'bg-[#1F8A53] text-white',
          accentText: 'text-[#1F8A53]',
          barColor: 'bg-[#1F8A53]',
          heatLabel: 'Stable SLA',
          heatGradient: 'from-[#1F8A53]/15 to-transparent',
          pulse: false
        };
      case 'optimal':
      default:
        return {
          cardBg: 'bg-gradient-to-br from-white/90 via-[#FAF4EB]/80 to-white/70',
          border: 'border-white/80 hover:border-[#E8622C]/50',
          ring: 'ring-1 ring-white/50',
          badgeBg: 'bg-[#191715] text-white',
          accentText: 'text-[#191715]',
          barColor: 'bg-[#E8622C]',
          heatLabel: 'Tier 1 Verified',
          heatGradient: 'from-[#E8622C]/10 to-transparent',
          pulse: false
        };
    }
  };

  const selectedCategory = heatmapData.find(c => c.categoryKey === selectedCategoryKey);

  return (
    <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 shadow-[0_8px_32px_rgba(26,23,21,0.06)] border border-white/80 ring-1 ring-white/50 flex flex-col gap-6">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-2 border-b border-white/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-[#E8622C] text-xs font-bold uppercase tracking-wider mb-2 border border-white/70 shadow-2xs">
            <Flame className="w-3.5 h-3.5" />
            <span>Category Confidence Heatmap</span>
          </div>
          <h3 className="font-didone font-bold text-2xl sm:text-3xl text-[#1A1A1A] tracking-tight flex items-center gap-2">
            <span>Product Group <span className="font-didone-italic text-[#E8622C] font-normal">Confidence Matrix</span></span>
          </h3>
          <p className="text-xs text-[#1A1A1A]/60 mt-0.5 max-w-2xl">
            Color-coded confidence overlay across product domains. Groups in terracotta or amber require immediate discrepancy resolution before auto-committing to the master catalog ledger.
          </p>
        </div>

        {/* Sort & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/70 shadow-2xs text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8C8276]" />
            <span className="text-[10px] font-bold text-[#8C8276] uppercase tracking-wider hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-bold text-[#191715] text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="urgency">Immediate Attention First</option>
              <option value="confidence_asc">Lowest Confidence Score</option>
              <option value="records_desc">Highest SKU Volume</option>
            </select>
          </div>

          <button
            onClick={() => onNavigateToTab?.('review_queue')}
            className="px-3.5 py-1.5 rounded-2xl bg-[#E8622C] text-white hover:bg-[#D45320] text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Open Review Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Heatmap Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-[#FAF4EB]/70 backdrop-blur-md p-3.5 rounded-2xl border border-[#DFCDBC]/40">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276]">Urgency Heatmap Scale:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#D45320] shadow-2xs" />
            <span className="font-bold text-[#191715]">&lt;75% Critical Attention</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#D97706] shadow-2xs" />
            <span className="font-bold text-[#191715]">75–85% Needs Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#1F8A53] shadow-2xs" />
            <span className="font-bold text-[#191715]">86–92% Stable SLA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#191715] shadow-2xs" />
            <span className="font-bold text-[#191715]">&gt;92% Optimal / Tier 1</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {heatmapData.map((cat) => {
          const styles = getTileStyles(cat.urgencyLevel, cat.avgConfidence);
          const isSelected = selectedCategoryKey === cat.categoryKey;

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategoryKey(isSelected ? null : cat.categoryKey)}
              className={`relative rounded-3xl p-5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-[0_8px_24px_rgba(26,23,21,0.04)] hover:shadow-lg ${styles.cardBg} ${styles.border} ${styles.ring} ${
                isSelected ? 'ring-2 ring-[#E8622C] shadow-md scale-[1.01]' : ''
              }`}
            >
              {/* Subtle top background heat flare */}
              <div className={`absolute top-0 right-0 w-36 h-28 bg-gradient-to-bl ${styles.heatGradient} pointer-events-none rounded-bl-full`} />

              {/* Tile Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-white/80 backdrop-blur-md text-[#191715] flex items-center justify-center border border-white/80 shadow-2xs">
                      {cat.icon}
                    </span>
                    <div>
                      <h4 className="font-didone font-bold text-base text-[#191715] leading-tight">
                        {cat.name}
                      </h4>
                      <span className="text-[10px] text-[#8C8276] font-mono font-medium">
                        {cat.totalSkus.toLocaleString()} SKUs
                      </span>
                    </div>
                  </div>

                  {/* Urgency Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-2xs ${styles.badgeBg} ${styles.pulse ? 'animate-pulse' : ''}`}>
                    {cat.urgencyLevel === 'critical' && <AlertTriangle className="w-3 h-3" />}
                    {cat.urgencyLevel === 'attention' && <AlertCircle className="w-3 h-3" />}
                    {cat.urgencyLevel === 'healthy' && <CheckCircle2 className="w-3 h-3" />}
                    {cat.urgencyLevel === 'optimal' && <CheckCircle2 className="w-3 h-3" />}
                    {styles.heatLabel}
                  </span>
                </div>

                {/* Score & Progress Ring Section */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/80 shadow-2xs my-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SvgProgressRing
                      value={cat.avgConfidence}
                      size={44}
                      strokeWidth={4.5}
                      glow={cat.avgConfidence >= 90}
                    />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8276] block">
                        Extraction Score
                      </span>
                      <span className={`font-didone font-bold text-lg leading-tight ${styles.accentText}`}>
                        {cat.avgConfidence}% <span className="text-xs font-normal text-[#8C8276]">Avg</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8276] block">
                      Needs Review
                    </span>
                    <span className={`font-mono font-bold text-sm ${cat.needsReviewCount > 0 ? styles.accentText : 'text-[#1F8A53]'}`}>
                      {cat.needsReviewCount} SKUs
                    </span>
                  </div>
                </div>

                {/* Top Discrepancy Driver */}
                <div className="text-xs text-[#5C554D] mt-2 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
                    Primary Resolution Focus:
                  </span>
                  <p className="line-clamp-2 leading-relaxed font-medium bg-white/40 p-2 rounded-xl border border-white/60">
                    {cat.topDiscrepancy}
                  </p>
                </div>
              </div>

              {/* Tile Footer Action */}
              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#8C8276]">
                  {cat.autoCommittedCount.toLocaleString()} Auto-Committed
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cat.recentSampleProduct && onSelectProduct) {
                      onSelectProduct(cat.recentSampleProduct);
                      onNavigateToTab?.('field_inspector');
                    } else {
                      onNavigateToTab?.('review_queue');
                    }
                  }}
                  className={`font-bold inline-flex items-center gap-1 hover:underline transition-all ${styles.accentText} cursor-pointer`}
                >
                  <span>{cat.needsReviewCount > 0 ? 'Triage Flagged' : 'Inspect Group'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Drill-Down Inspector when a Category Tile is Selected */}
      {selectedCategory && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-white via-white/95 to-[#FAF4EB] border border-[#E8622C]/40 shadow-[0_12px_32px_rgba(232,98,44,0.1)] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-[#E8622C]/10 text-[#E8622C] flex items-center justify-center">
                {selectedCategory.icon}
              </span>
              <div>
                <h4 className="font-didone font-bold text-lg text-[#191715]">
                  {selectedCategory.name} Deep Attribution Ledger
                </h4>
                <p className="text-xs text-[#8C8276]">
                  {selectedCategory.totalSkus.toLocaleString()} total catalogue records • {selectedCategory.needsReviewCount} queued for review
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (selectedCategory.recentSampleProduct && onSelectProduct) {
                    onSelectProduct(selectedCategory.recentSampleProduct);
                    onNavigateToTab?.('field_inspector');
                  } else {
                    onNavigateToTab?.('catalog');
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#191715] text-white hover:bg-[#E8622C] text-xs font-bold transition-colors cursor-pointer"
              >
                Inspect Sample SKU ({selectedCategory.recentSampleSku || 'Browse'})
              </button>
              <button
                onClick={() => setSelectedCategoryKey(null)}
                className="text-xs text-[#8C8276] hover:text-[#191715] px-2 py-1 underline cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3.5 text-xs">
            <div className="p-3 rounded-2xl bg-white/70 border border-white/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
                Average Confidence
              </span>
              <span className="font-didone font-bold text-xl text-[#E8622C] mt-1 block">
                {selectedCategory.avgConfidence}%
              </span>
              <span className="text-[11px] text-[#5C554D] mt-0.5 block">
                Multimodal OCR extraction fidelity
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/70 border border-white/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
                Primary Discrepancy Trigger
              </span>
              <p className="text-[#191715] font-medium mt-1 leading-relaxed">
                {selectedCategory.topDiscrepancy}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/70 border border-white/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
                Recommended Action
              </span>
              <p className="text-[#5C554D] mt-1 leading-relaxed">
                {selectedCategory.urgencyLevel === 'critical'
                  ? 'High discrepancy rate. Apply direct OEM vector datasheets or manual threshold overrides.'
                  : selectedCategory.urgencyLevel === 'attention'
                  ? 'Review contested electrical and dimensional bounds in the Review Queue.'
                  : 'Automated ingestion healthy. Meets SLA requirements for autonomous ERP synchronization.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
