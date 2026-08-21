import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, ExternalLink, ChevronRight, AlertCircle, ArrowUpRight, FileText, CheckCircle2 } from "lucide-react";
import { getProduct } from "../lib/api";
import type { ProductDetailResponse, ProductField } from "../lib/types";
import { ConfidenceBadge, ConfidenceBar, SourceBadge, StatusBadge } from "../components/Badges";
import FieldInspector from "../components/FieldInspector";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState<ProductField | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="hero-card max-w-xl mx-auto text-center py-12 my-8">
        <AlertCircle className="mx-auto text-red-400 mb-3" size={36} />
        <h3 className="text-xl font-extrabold text-white mb-2">Product Record Not Found</h3>
        <p className="text-xs text-[#9DA0B1] mb-6">{error || "The requested product does not exist in the catalog repository."}</p>
        <button className="px-5 py-2.5 bg-[#D4FF00] text-black font-extrabold text-xs rounded-xl cursor-pointer" onClick={() => navigate("/")}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { product, sources } = data;
  const reviewCount = product.fields.filter((f) => f.status === "needs_review").length;
  const committedCount = product.fields.filter((f) => f.status === "auto_committed").length;
  const correctedCount = product.fields.filter((f) => f.status === "human_corrected").length;

  return (
    <div className="w-full space-y-8">
      
      {/* ── Breadcrumb & Header Section ───────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1A1C27]">
        <div>
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-2 text-xs text-[#9DA0B1] font-semibold mb-2">
            <span className="cursor-pointer hover:text-white" onClick={() => navigate("/")}>Catalog</span>
            <ChevronRight size={14} className="text-[#626577]" />
            <span className="text-[#D4FF00]">{data.category_schema.display_name}</span>
          </div>

          {/* Product Title + Confidence Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {product.name}
            </h1>
            <ConfidenceBadge confidence={product.confidence_overall} />
          </div>

          <div className="text-xs text-[#626577] font-mono mt-1">
            Product UUID: <span className="text-[#9DA0B1]">{product.id}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2.5 bg-[#181920] border border-[#232532] hover:border-[#D4FF00] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/review")}
          >
            Review Queue
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-extrabold text-[11px]">
              {reviewCount}
            </span>
          </button>
          <button
            className="px-4 py-2.5 bg-[#D4FF00] text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-[0_0_16px_rgba(212,255,0,0.2)]"
            onClick={() => navigate("/ingest")}
          >
            + Ingest New Source
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards Bar ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="hero-card flex flex-col justify-between">
          <div className="text-xs font-bold text-[#9DA0B1] uppercase tracking-wider mb-2">Total Schema Fields</div>
          <div className="text-3xl font-extrabold text-white">{product.fields.length}</div>
        </div>
        <div className="hero-card flex flex-col justify-between">
          <div className="text-xs font-bold text-[#9DA0B1] uppercase tracking-wider mb-2">Auto-Committed</div>
          <div className="text-3xl font-extrabold text-[#D4FF00]">{committedCount}</div>
        </div>
        <div className="hero-card flex flex-col justify-between">
          <div className="text-xs font-bold text-[#9DA0B1] uppercase tracking-wider mb-2">Needs Review</div>
          <div className="text-3xl font-extrabold text-yellow-400">{reviewCount}</div>
        </div>
        <div className="hero-card flex flex-col justify-between">
          <div className="text-xs font-bold text-[#9DA0B1] uppercase tracking-wider mb-2">Human Corrected</div>
          <div className="text-3xl font-extrabold text-blue-400">{correctedCount}</div>
        </div>
      </div>

      {/* ── Provenance Sources Section ────────────────────────────── */}
      <div className="hero-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldCheck className="text-[#D4FF00]" size={18} />
            Verified Provenance Sources
          </div>
          <span className="text-xs text-[#9DA0B1]">{sources.length} Active Document{sources.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="space-y-3">
          {sources.map((s) => (
            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#121319] border border-[#232532] rounded-xl">
              <div className="flex items-center gap-3">
                <SourceBadge origin={s.origin} trustTier={s.trust_tier} />
                <span className="font-mono text-xs text-white truncate max-w-lg">{s.origin}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#9DA0B1]">
                <span className="font-mono px-2 py-1 rounded bg-[#181920] border border-[#232532] text-[#D4FF00]">
                  {s.source_type.toUpperCase()}
                </span>
                <span>Ref: <code className="font-mono text-gray-400">{s.id.slice(0, 8)}</code></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Extracted Schema Fields Table ──────────────────────────── */}
      <div className="hero-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-white">Extracted Schema Fields</h3>
            <p className="text-xs text-[#9DA0B1] mt-0.5">Every field carries an immutable verbatim source citation and confidence score.</p>
          </div>
          <span className="text-xs font-bold text-[#D4FF00] bg-[#D4FF00]/10 px-3 py-1.5 rounded-full border border-[#D4FF00]/20 flex items-center gap-1.5 self-start">
            <span>💡</span> Click any row to inspect verbatim source excerpt
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="financia-table w-full">
            <thead>
              <tr>
                <th className="w-1/4">Field Name</th>
                <th className="w-1/3">Extracted Value</th>
                <th className="w-1/4">Confidence Score</th>
                <th>Validation Status</th>
                <th className="w-10 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {product.fields.map((field) => (
                <tr
                  key={field.id}
                  onClick={() => setInspecting(field)}
                  className="cursor-pointer group"
                >
                  {/* Field Name & System Key */}
                  <td>
                    <div>
                      <div className="font-bold text-white text-xs group-hover:text-[#D4FF00] transition-colors">
                        {field.display_name}
                      </div>
                      <div className="font-mono text-[11px] text-[#626577] mt-0.5">{field.name}</div>
                    </div>
                  </td>

                  {/* Extracted Value + Proper Unit Spacing */}
                  <td>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-extrabold text-white text-sm">
                        {formatValue(field.value)}
                      </span>
                      {field.unit && (
                        <span className="text-xs font-semibold text-[#D4FF00] bg-[#D4FF00]/10 px-1.5 py-0.5 rounded">
                          {field.unit}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Confidence Badge & Bar */}
                  <td>
                    <div className="flex items-center gap-3">
                      <ConfidenceBadge confidence={field.confidence} />
                      <div className="w-24 hidden md:block">
                        <ConfidenceBar confidence={field.confidence} />
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td>
                    <StatusBadge status={field.status} />
                  </td>

                  {/* Action Arrow */}
                  <td className="text-right">
                    <div className="w-7 h-7 rounded-full bg-[#181920] border border-[#232532] text-gray-400 group-hover:text-black group-hover:bg-[#D4FF00] group-hover:border-[#D4FF00] flex items-center justify-center transition-all ml-auto">
                      <ArrowUpRight size={14} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Slide-over Field Inspector ──────────────────────────── */}
      {inspecting && id && (
        <FieldInspector
          productId={id}
          field={inspecting}
          onClose={() => setInspecting(null)}
        />
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
