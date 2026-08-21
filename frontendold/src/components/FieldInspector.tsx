import { useEffect, useState } from "react";
import { X, ShieldCheck, Quote, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { inspectField } from "../lib/api";
import type { FieldInspectResponse, ProductField } from "../lib/types";
import { ConfidenceBadge, ConfidenceBar, StatusBadge } from "./Badges";

interface Props {
  productId: string;
  field: ProductField;
  onClose: () => void;
}

export default function FieldInspector({ productId, field, onClose }: Props) {
  const [data, setData] = useState<FieldInspectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    inspectField(productId, field.id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [productId, field.id]);

  return (
    <div className="inspector-overlay" onClick={onClose}>
      <div className="inspector-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#262833] mb-6">
          <div>
            <div className="text-[10px] font-bold text-[#D4FF00] uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <ShieldCheck size={14} /> Provenance Inspector
            </div>
            <h2 className="text-xl font-extrabold text-white">{field.display_name}</h2>
            <div className="font-mono text-xs text-gray-500">{field.name}</div>
          </div>
          <button
            className="w-8 h-8 rounded-full bg-[#1C1D24] border border-[#262833] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-xs">
            <div className="w-6 h-6 border-2 border-[#D4FF00] border-t-transparent rounded-full animate-spin mr-2" />
            Loading Provenance Trace…
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Extracted Value */}
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Extracted Field Value
              </div>
              <div className="text-2xl font-extrabold text-white">
                {formatValue(data.field.value)}
                {data.field.unit && (
                  <span className="text-sm font-normal text-gray-400 ml-2">{data.field.unit}</span>
                )}
              </div>
            </div>

            {/* Confidence & Status */}
            <div className="p-4 bg-[#1C1D24] border border-[#262833] rounded-2xl">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Validation & Confidence Metric
              </div>
              <div className="flex items-center gap-3 mb-3">
                <ConfidenceBadge confidence={data.confidence} />
                <div className="flex-1">
                  <ConfidenceBar confidence={data.confidence} />
                </div>
              </div>
              <StatusBadge status={data.status} />
            </div>

            {/* Verbatim Source Excerpt */}
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Quote size={14} className="text-[#D4FF00]" /> Verbatim Source Excerpt
              </div>
              <div className="inspector-excerpt">
                "{data.source_excerpt_text}"
              </div>
              <div className="text-[11px] text-gray-500 font-mono mt-2">
                Source Ref: {data.source_document.origin}
              </div>
            </div>

            {/* Extraction Reasoning */}
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Agentic Extraction Reasoning
              </div>
              <p className="text-xs text-gray-300 leading-relaxed bg-[#1C1D24] p-3.5 rounded-xl border border-[#262833]">
                {data.reasoning}
              </p>
            </div>

            {/* Source Document Details */}
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText size={14} className="text-gray-400" /> Original Source Metadata
              </div>
              <div className="p-3.5 bg-[#1C1D24] border border-[#262833] rounded-xl text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Origin / URL:</span>
                  <span className="font-mono text-gray-300 truncate max-w-xs">{data.source_document.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Format:</span>
                  <span className="text-white font-semibold">{data.source_document.source_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trust Classification:</span>
                  <span className="text-[#D4FF00] font-semibold">
                    Tier {data.source_document.trust_tier} (
                    {data.source_document.trust_tier === 1 ? "Manufacturer" : data.source_document.trust_tier === 2 ? "Distributor" : "Marketplace"}
                    )
                  </span>
                </div>
              </div>
            </div>

            {/* Alternative Extraction Candidates */}
            {data.alternatives.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Alternative Candidates Across Sources
                </div>
                <div className="space-y-2">
                  {data.alternatives.map((alt, i) => (
                    <div key={i} className="p-3 bg-[#1C1D24] border border-[#262833] rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{formatValue(alt.value)}</div>
                        <div className="text-[10px] text-gray-500">{alt.source_origin}</div>
                      </div>
                      <span className="font-semibold text-gray-400">{alt.confidence}% conf</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
