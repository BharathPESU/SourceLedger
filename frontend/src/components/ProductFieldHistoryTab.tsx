import React, { useState, useMemo } from 'react';
import { 
  History, 
  Clock, 
  UserCheck, 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  Edit3, 
  RotateCcw, 
  Search, 
  SlidersHorizontal, 
  FileSpreadsheet, 
  Sparkles, 
  AlertCircle,
  ShieldCheck,
  Tag,
  Check
} from 'lucide-react';
import { ProductRecord, FieldAuditEntry } from '../types';
import { SvgProgressRing } from './SvgProgressRing';

interface ProductFieldHistoryTabProps {
  product: ProductRecord;
  onRevertField?: (fieldId: string, valueToRestore: string, fieldName: string) => void;
}

export const ProductFieldHistoryTab: React.FC<ProductFieldHistoryTabProps> = ({
  product,
  onRevertField,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'manual_only' | 'approvals' | 'ai_ingest'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>('all');
  const [justRevertedId, setJustRevertedId] = useState<string | null>(null);

  // Generate fallback rich initial audit entries if product has none yet
  const auditEntries = useMemo<FieldAuditEntry[]>(() => {
    if (product.auditLog && product.auditLog.length > 0) {
      return product.auditLog;
    }

    // Default historical baseline entries tailored to the product
    const initialBaseline: FieldAuditEntry[] = [
      {
        id: `audit-init-${product.id}-1`,
        timestamp: '12 mins ago',
        fieldId: product.fields[0]?.id || 'f-101',
        fieldName: product.fields[0]?.name || 'Frequency Response',
        previousValue: '20 Hz - 20 kHz (SBC Default)',
        newValue: product.fields[0]?.value || '4 Hz - 40,000 Hz',
        changedBy: 'Balu R. (Lead Catalog Engineer)',
        changeType: 'manual_override',
        confidenceBefore: product.fields[0]?.confidence || 64,
        confidenceAfter: 99,
        reason: 'Adjusted canonical bounds to JEITA active wired test standard per Section 2.4 rather than wireless compression limits.',
        sourceRef: product.sourceDocument
      },
      {
        id: `audit-init-${product.id}-2`,
        timestamp: '45 mins ago',
        fieldId: product.fields[1]?.id || 'f-102',
        fieldName: product.fields[1]?.name || 'Battery Life (ANC ON)',
        previousValue: '24 Hours (LDAC Mode)',
        newValue: product.fields[1]?.value || '30 Hours',
        changedBy: 'Alex Rivera (Catalog Reviewer)',
        changeType: 'verified_approval',
        confidenceBefore: 88,
        confidenceAfter: 98,
        reason: 'Confirmed standard AAC continuous playback benchmark across primary OEM spec sheet tables.',
        sourceRef: product.sourceDocument
      },
      {
        id: `audit-init-${product.id}-3`,
        timestamp: '3 hours ago',
        fieldId: product.fields[2]?.id || 'f-103',
        fieldName: product.fields[2]?.name || 'Weight',
        previousValue: '8.82 oz',
        newValue: product.fields[2]?.value || '250 g',
        changedBy: 'Automated Metric Normalizer',
        changeType: 'batch_sync',
        confidenceBefore: 90,
        confidenceAfter: 96,
        reason: 'Standardized imperial ounce measurement to metric grams format to satisfy master catalog schema.',
        sourceRef: product.sourceDocument
      },
      {
        id: `audit-init-${product.id}-4`,
        timestamp: 'Yesterday at 4:15 PM',
        fieldId: 'f-root-ingest',
        fieldName: 'Full Record Entity Extraction',
        previousValue: 'Raw PDF Unparsed Bounding Boxes',
        newValue: `${product.fields.length} Canonical Attribute Entities Extracted`,
        changedBy: 'Gemini Multimodal OCR Ingest',
        changeType: 'ai_initial_extraction',
        confidenceBefore: 0,
        confidenceAfter: product.confidence,
        reason: `Initial multimodal spatial vector parse of ${product.sourceDocument} with 8 datasheet pages.`,
        sourceRef: product.sourceDocument
      }
    ];

    return initialBaseline;
  }, [product]);

  // Unique fields present in audit log for filtering dropdown
  const uniqueAuditFields = useMemo(() => {
    const set = new Set(auditEntries.map(e => e.fieldName));
    return Array.from(set);
  }, [auditEntries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return auditEntries.filter(entry => {
      // Type filter
      if (filterType === 'manual_only' && entry.changeType !== 'manual_override' && entry.changeType !== 'revert') {
        return false;
      }
      if (filterType === 'approvals' && entry.changeType !== 'verified_approval') {
        return false;
      }
      if (filterType === 'ai_ingest' && entry.changeType !== 'ai_initial_extraction' && entry.changeType !== 'batch_sync') {
        return false;
      }

      // Field filter
      if (selectedFieldFilter !== 'all' && entry.fieldName !== selectedFieldFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          entry.fieldName.toLowerCase().includes(q) ||
          entry.previousValue.toLowerCase().includes(q) ||
          entry.newValue.toLowerCase().includes(q) ||
          entry.changedBy.toLowerCase().includes(q) ||
          (entry.reason && entry.reason.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [auditEntries, filterType, selectedFieldFilter, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Audit ID', 'Timestamp', 'Field Name', 'Previous Value', 'New Value', 'Changed By', 'Change Type', 'Confidence Before', 'Confidence After', 'Reason', 'Source Reference'];
    const rows = filteredEntries.map(e => [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.fieldName}"`,
      `"${e.previousValue.replace(/"/g, '""')}"`,
      `"${e.newValue.replace(/"/g, '""')}"`,
      `"${e.changedBy}"`,
      `"${e.changeType}"`,
      e.confidenceBefore,
      e.confidenceAfter,
      `"${(e.reason || '').replace(/"/g, '""')}"`,
      `"${(e.sourceRef || product.sourceDocument).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${product.sku}_field_audit_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRevertClick = (entry: FieldAuditEntry) => {
    if (onRevertField && entry.fieldId && entry.previousValue && entry.previousValue !== 'Raw PDF Unparsed Bounding Boxes') {
      onRevertField(entry.fieldId, entry.previousValue, entry.fieldName);
      setJustRevertedId(entry.id);
      setTimeout(() => setJustRevertedId(null), 3000);
    }
  };

  const manualChangeCount = auditEntries.filter(e => e.changeType === 'manual_override' || e.changeType === 'revert').length;
  const verifiedCount = auditEntries.filter(e => e.changeType === 'verified_approval').length;

  return (
    <div className="space-y-6">
      {/* Header Audit Summary Card */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.04)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-[#E8622C] text-xs font-bold uppercase tracking-wider mb-2 border border-white/70 shadow-2xs">
              <History className="w-3.5 h-3.5" />
              <span>Immutable Field Audit Log</span>
            </div>
            <h3 className="font-didone font-bold text-2xl text-[#191715] tracking-tight">
              Attribute Modification <span className="font-didone-italic text-[#E8622C] font-normal">& Governance Trail</span>
            </h3>
            <p className="text-xs text-[#5C554D] mt-1 max-w-2xl leading-relaxed">
              Complete chronological audit trail recording all human overrides, AI normalizations, and verified approvals for SKU <strong className="text-[#191715] font-mono">{product.sku}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-full bg-white/80 hover:bg-white text-[#191715] text-xs font-bold border border-white/80 shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#1F8A53]" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>

        {/* Metric Badges Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/60">
          <div className="p-3.5 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
              Total Logged Events
            </span>
            <span className="font-didone font-bold text-xl text-[#191715] mt-0.5 block">
              {auditEntries.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
              Manual Overrides
            </span>
            <span className="font-didone font-bold text-xl text-[#E8622C] mt-0.5 block">
              {manualChangeCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
              Verified Approvals
            </span>
            <span className="font-didone font-bold text-xl text-[#1F8A53] mt-0.5 block">
              {verifiedCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
              Latest Activity
            </span>
            <span className="font-mono font-bold text-xs text-[#191715] mt-1.5 block truncate">
              {auditEntries[0]?.timestamp || product.lastUpdated}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Toolbar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.04)] flex flex-wrap items-center justify-between gap-4">
        {/* Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/60 backdrop-blur-md p-1.5 rounded-full border border-white/70 shadow-2xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#191715] text-white shadow-xs'
                : 'text-[#5C554D] hover:text-[#191715]'
            }`}
          >
            All Events ({auditEntries.length})
          </button>
          <button
            onClick={() => setFilterType('manual_only')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterType === 'manual_only'
                ? 'bg-[#E8622C] text-white shadow-xs'
                : 'text-[#5C554D] hover:text-[#191715]'
            }`}
          >
            Manual Overrides ({manualChangeCount})
          </button>
          <button
            onClick={() => setFilterType('approvals')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterType === 'approvals'
                ? 'bg-[#1F8A53] text-white shadow-xs'
                : 'text-[#5C554D] hover:text-[#191715]'
            }`}
          >
            Approvals ({verifiedCount})
          </button>
          <button
            onClick={() => setFilterType('ai_ingest')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterType === 'ai_ingest'
                ? 'bg-[#191715] text-white shadow-xs'
                : 'text-[#5C554D] hover:text-[#191715]'
            }`}
          >
            AI Normalizations
          </button>
        </div>

        {/* Search & Field Select */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8C8276] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit changes..."
              className="bg-white/60 backdrop-blur-md text-xs text-[#191715] pl-8 pr-3 py-2 rounded-xl border border-white/70 focus:outline-hidden focus:border-[#E8622C] w-48 sm:w-56 shadow-2xs placeholder:text-[#8C8276]"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/70 shadow-2xs text-xs">
            <Tag className="w-3.5 h-3.5 text-[#8C8276]" />
            <select
              value={selectedFieldFilter}
              onChange={(e) => setSelectedFieldFilter(e.target.value)}
              className="bg-transparent font-bold text-[#191715] text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Fields</option>
              {uniqueAuditFields.map(fn => (
                <option key={fn} value={fn}>{fn}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Timeline Stream */}
      <div className="space-y-4">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry, index) => {
            const isManual = entry.changeType === 'manual_override' || entry.changeType === 'revert';
            const isApproval = entry.changeType === 'verified_approval';
            const isAI = entry.changeType === 'ai_initial_extraction' || entry.changeType === 'batch_sync';
            const canRevert = Boolean(onRevertField && entry.previousValue && entry.previousValue !== 'Raw PDF Unparsed Bounding Boxes');

            return (
              <div
                key={entry.id}
                className={`relative bg-white/70 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border transition-all shadow-[0_8px_32px_rgba(26,23,21,0.04)] hover:shadow-lg ${
                  isManual
                    ? 'border-[#E8622C]/40 hover:border-[#E8622C]'
                    : isApproval
                    ? 'border-[#1F8A53]/40 hover:border-[#1F8A53]'
                    : 'border-white/80 hover:border-[#DFCDBC]'
                }`}
              >
                {/* Event Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Change Type Badge */}
                    {isManual ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#E8622C] text-white flex items-center gap-1 shadow-2xs">
                        <Edit3 className="w-3 h-3" />
                        {entry.changeType === 'revert' ? 'Value Reverted' : 'Manual Override'}
                      </span>
                    ) : isApproval ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#1F8A53] text-white flex items-center gap-1 shadow-2xs">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Approval
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#191715] text-white flex items-center gap-1 shadow-2xs">
                        <Bot className="w-3 h-3" />
                        {entry.changeType === 'batch_sync' ? 'Auto-Normalized' : 'AI Multimodal Extraction'}
                      </span>
                    )}

                    {/* Field Name */}
                    <span className="font-display font-bold text-base text-[#191715]">
                      {entry.fieldName}
                    </span>
                  </div>

                  {/* Timestamp & User */}
                  <div className="flex items-center gap-3 text-xs text-[#8C8276]">
                    <span className="flex items-center gap-1 font-semibold text-[#191715]">
                      {isManual || isApproval ? <UserCheck className="w-3.5 h-3.5 text-[#E8622C]" /> : <Sparkles className="w-3.5 h-3.5 text-[#8C8276]" />}
                      {entry.changedBy}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {entry.timestamp}
                    </span>
                  </div>
                </div>

                {/* Diff Comparison Block */}
                <div className="my-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Previous State */}
                  <div className="p-3.5 rounded-2xl bg-white/50 backdrop-blur-md border border-white/70">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block mb-1">
                      Previous Value
                    </span>
                    <p className="font-mono text-xs text-[#8C8276] line-through decoration-[#D45320] leading-relaxed break-words">
                      {entry.previousValue}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-[#8C8276]">
                      <span>Confidence Before:</span>
                      <strong className="text-[#191715] font-mono">{entry.confidenceBefore}%</strong>
                    </div>
                  </div>

                  {/* New Canonical State */}
                  <div className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F8A53] block mb-1">
                      Updated Canonical Value
                    </span>
                    <p className="font-display font-bold text-sm text-[#191715] leading-relaxed break-words">
                      {entry.newValue}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-[#1F8A53]">
                      <span>Confidence After:</span>
                      <strong className="text-[#1F8A53] font-mono">{entry.confidenceAfter}%</strong>
                    </div>
                  </div>
                </div>

                {/* Reason & Revert Action Row */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {entry.reason && (
                    <p className="text-[#5C554D] leading-relaxed italic bg-white/40 p-2.5 rounded-xl border border-white/60 flex-1">
                      "{entry.reason}"
                    </p>
                  )}

                  {canRevert && (
                    <div className="shrink-0 flex items-center gap-2">
                      {justRevertedId === entry.id ? (
                        <span className="px-3 py-1.5 rounded-xl bg-[#EAF5EE] text-[#1F8A53] font-bold text-xs flex items-center gap-1 border border-[#1F8A53]/30">
                          <Check className="w-3.5 h-3.5" /> Reverted to Previous
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRevertClick(entry)}
                          className="px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-[#5C554D] hover:text-[#191715] font-bold text-xs border border-white/80 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                          title={`Restore "${entry.previousValue}" as the canonical attribute`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#E8622C]" />
                          <span>Revert to Previous</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-12 text-center border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.04)] max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF4EB] text-[#8C8276] flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h4 className="font-didone font-bold text-lg text-[#191715]">
              No Audit Records Found
            </h4>
            <p className="text-xs text-[#5C554D] mt-1">
              No field history matches your active filter criteria. Try resetting the search query or selecting "All Events".
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
