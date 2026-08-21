import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, FileText, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Layers, FileCheck } from "lucide-react";
import { getCategories, ingestSource } from "../lib/api";
import type { CategorySchema, IngestResponse, SourceType } from "../lib/types";

export default function IngestPage() {
  const [sourceType, setSourceType] = useState<SourceType>("web");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [trustTier, setTrustTier] = useState(3);
  const [categories, setCategories] = useState<CategorySchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then((r) => setCategories(r.categories)).catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await ingestSource({
        source_type: sourceType,
        content: content.trim(),
        category: category || undefined,
        trust_tier: trustTier,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingestion failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setContent(base64);
      setSourceType("pdf");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="w-full">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="mb-8 pb-4 border-b border-[#1A1C27]">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Ingest Product Datasheet
        </h1>
        <p className="text-sm text-[#9DA0B1]">
          Submit product specification URLs or upload technical PDF datasheets for automated multi-agent extraction & provenance verification.
        </p>
      </div>

      {/* ── 12-Column Responsive Layout Grid ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Card (7 Cols) */}
        <div className="lg:col-span-7 hero-card">
          <form onSubmit={handleSubmit}>
            
            {/* Format Pill Switcher */}
            <div className="mb-6">
              <label className="form-label">Select Source Format</label>
              <div className="filter-pills-track w-full flex">
                <button
                  type="button"
                  className={`filter-pill-btn flex-1 flex items-center justify-center gap-2 py-3 ${sourceType === "web" ? "active" : ""}`}
                  onClick={() => { setSourceType("web"); setContent(""); }}
                >
                  <Globe size={16} />
                  Web URL / Raw Text
                </button>
                <button
                  type="button"
                  className={`filter-pill-btn flex-1 flex items-center justify-center gap-2 py-3 ${sourceType === "pdf" ? "active" : ""}`}
                  onClick={() => { setSourceType("pdf"); setContent(""); }}
                >
                  <FileText size={16} />
                  PDF Datasheet Upload
                </button>
              </div>
            </div>

            {/* Source Content Input */}
            <div className="mb-6">
              <label className="form-label">
                {sourceType === "web" ? "Product Datasheet URL or Technical Specification Text" : "Upload PDF File"}
              </label>
              {sourceType === "web" ? (
                <textarea
                  className="form-textarea text-sm font-mono leading-relaxed min-h-[160px]"
                  rows={6}
                  placeholder="https://example.com/product/pump-cr15 or paste specification text..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              ) : (
                <div className="p-8 border border-dashed border-[#303344] bg-[#121319] rounded-2xl text-center">
                  <FileText className="mx-auto text-[#9DA0B1] mb-3" size={36} />
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-[#9DA0B1] file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#D4FF00] file:text-black hover:file:bg-[#C5EF00] cursor-pointer"
                  />
                  {content && (
                    <p className="text-xs text-[#D4FF00] font-bold mt-4 flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={16} /> PDF Loaded Successfully ({Math.round(content.length * 0.75 / 1024)} KB)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Category Select */}
            <div className="mb-6">
              <label className="form-label">Target Industry Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Auto-Detect Category Schema</option>
                {categories.map((c) => (
                  <option key={c.category_key} value={c.category_key}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Trust Classification */}
            <div className="mb-8">
              <label className="form-label">Source Trust Classification</label>
              <select
                className="form-select"
                value={trustTier}
                onChange={(e) => setTrustTier(Number(e.target.value))}
              >
                <option value={1}>Tier 1: Manufacturer Portal / OEM Specification (Highest Trust)</option>
                <option value={2}>Tier 2: Authorized Distributor Specification Sheet</option>
                <option value={3}>Tier 3: Marketplace Listing / Third-Party Catalog</option>
              </select>
            </div>

            {/* Submit Action CTA */}
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="w-full py-4 bg-[#D4FF00] hover:bg-[#C5EF00] text-black font-extrabold text-sm rounded-xl transition-all shadow-[0_0_24px_rgba(212,255,0,0.25)] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Running Multi-Agent Extraction Pipeline…
                </>
              ) : (
                <>
                  Ingest & Extract Provenance
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Status & Architecture Card (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Live Ingestion Result Card */}
          {result && (
            <div className={`hero-card border ${result.status === "completed" ? "border-[#D4FF00]/50" : "border-red-500/50"}`}>
              <div className="flex items-center gap-3 mb-3">
                {result.status === "completed" ? (
                  <CheckCircle2 className="text-[#D4FF00]" size={24} />
                ) : (
                  <AlertTriangle className="text-red-500" size={24} />
                )}
                <span className="font-extrabold text-white text-base">
                  {result.status === "completed" ? "Extraction Complete" : "Pipeline Failed"}
                </span>
              </div>
              <p className="text-xs text-[#9DA0B1] mb-5 leading-relaxed">
                {result.message}
              </p>
              {result.product_id && (
                <button
                  className="w-full py-3 bg-[#D4FF00] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_16px_rgba(212,255,0,0.2)]"
                  onClick={() => navigate(`/products/${result.product_id}`)}
                >
                  Inspect Product Record & Verbatim Quotes
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="hero-card border border-red-500/50">
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm mb-2">
                <AlertTriangle size={20} /> Ingestion Error
              </div>
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Architecture & Rules Card */}
          <div className="hero-card">
            <div className="flex items-center gap-2 text-[#D4FF00] font-bold text-sm mb-6">
              <ShieldCheck size={18} />
              SourceLedger Architecture Guarantees
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/10 text-[#D4FF00] flex items-center justify-center font-extrabold text-xs flex-shrink-0 border border-[#D4FF00]/20">
                  1
                </div>
                <div>
                  <div className="font-bold text-white text-sm mb-1">Verbatim Source Provenance</div>
                  <div className="text-xs text-[#9DA0B1] leading-relaxed">
                    No field is recorded without an exact source document reference and exact character excerpt attached.
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/10 text-[#D4FF00] flex items-center justify-center font-extrabold text-xs flex-shrink-0 border border-[#D4FF00]/20">
                  2
                </div>
                <div>
                  <div className="font-bold text-white text-sm mb-1">Confidence-Based Routing</div>
                  <div className="text-xs text-[#9DA0B1] leading-relaxed">
                    Fields extracted with &lt; 70% confidence bypass automatic commit and route to the human review queue.
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/10 text-[#D4FF00] flex items-center justify-center font-extrabold text-xs flex-shrink-0 border border-[#D4FF00]/20">
                  3
                </div>
                <div>
                  <div className="font-bold text-white text-sm mb-1">Zero Bare Predictions</div>
                  <div className="text-xs text-[#9DA0B1] leading-relaxed">
                    Eliminates ungrounded LLM hallucination scores. Every value is reasoned and verifiable.
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
