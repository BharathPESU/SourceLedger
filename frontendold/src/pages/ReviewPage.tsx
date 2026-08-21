import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Edit2, X, RefreshCw, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { getReviewQueue, reviewField } from "../lib/api";
import type { ReviewQueueItem } from "../lib/types";
import { ConfidenceBadge } from "../components/Badges";

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadQueue = () => {
    setLoading(true);
    getReviewQueue()
      .then((r) => setItems(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(loadQueue, []);

  async function handleAction(item: ReviewQueueItem, action: "accept" | "edit" | "reject") {
    setActionLoading(item.field.id);
    try {
      await reviewField(item.product_id, item.field.id, {
        action,
        corrected_value: action === "edit" ? editValue : undefined,
      });
      setEditingId(null);
      setEditValue("");
      loadQueue();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1C27]">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1">
            Human Review Queue
          </h1>
          <p className="text-xs text-[#9DA0B1]">
            {items.length} extracted field{items.length !== 1 ? "s" : ""} required human verification due to low extraction confidence.
          </p>
        </div>
        <button
          className="px-4 py-2.5 bg-[#181920] border border-[#232532] hover:border-[#D4FF00] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
          onClick={loadQueue}
        >
          <RefreshCw size={15} /> Refresh Queue
        </button>
      </div>

      {/* ── Quick Stats Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="hero-card">
          <div className="text-xs font-bold text-[#9DA0B1] uppercase tracking-wider mb-2">Pending Items</div>
          <div className="text-3xl font-extrabold text-yellow-400">{items.length}</div>
        </div>
        <div className="hero-card">
          <div className="text-xs font-bold text-[#9DA0B1] uppercase tracking-wider mb-2">Affected Records</div>
          <div className="text-3xl font-extrabold text-white">{new Set(items.map(i => i.product_id)).size}</div>
        </div>
        <div className="hero-card">
          <div className="text-xs font-bold text-[#9DA0B1] uppercase tracking-wider mb-2">Avg. Queue Confidence</div>
          <div className="text-3xl font-extrabold text-red-400">
            {items.length > 0 ? `${Math.round(items.reduce((s, i) => s + i.field.confidence, 0) / items.length)}%` : "100%"}
          </div>
        </div>
      </div>

      {/* ── Queue Table or Empty State ───────────────────────────── */}
      {items.length === 0 ? (
        <div className="hero-card text-center py-20">
          <CheckCircle2 size={48} className="mx-auto text-[#D4FF00] mb-4 shadow-[0_0_24px_rgba(212,255,0,0.3)]" />
          <h3 className="text-xl font-extrabold text-white mb-2">Review Queue Complete</h3>
          <p className="text-xs text-[#9DA0B1]">All extracted fields across the catalog are auto-committed or human-verified.</p>
        </div>
      ) : (
        <div className="hero-card">
          <div className="overflow-x-auto">
            <table className="financia-table w-full">
              <thead>
                <tr>
                  <th className="w-1/4">Product Record</th>
                  <th className="w-1/5">Target Field</th>
                  <th className="w-1/4">Extracted Value</th>
                  <th>Confidence</th>
                  <th className="w-56 text-right">Human Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.field.id}>
                    {/* Product Name */}
                    <td>
                      <div>
                        <div
                          className="font-bold text-white text-xs cursor-pointer hover:text-[#D4FF00] transition-colors flex items-center gap-1"
                          onClick={() => navigate(`/products/${item.product_id}`)}
                        >
                          {item.product_name}
                          <ArrowUpRight size={12} />
                        </div>
                        <div className="text-[11px] text-[#626577] mt-0.5">{item.category_display_name}</div>
                      </div>
                    </td>

                    {/* Field Name */}
                    <td>
                      <div>
                        <div className="font-bold text-white text-xs">{item.field.display_name}</div>
                        <div className="font-mono text-[11px] text-[#626577] mt-0.5">{item.field.name}</div>
                      </div>
                    </td>

                    {/* Extracted Value / Edit Input */}
                    <td>
                      {editingId === item.field.id ? (
                        <input
                          className="form-input text-xs py-1.5 px-3 w-40"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Corrected value…"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-white text-xs">
                            {formatValue(item.field.value)}
                          </span>
                          {item.field.unit && (
                            <span className="text-xs font-semibold text-[#D4FF00] bg-[#D4FF00]/10 px-1.5 py-0.5 rounded">
                              {item.field.unit}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Confidence Badge */}
                    <td>
                      <ConfidenceBadge confidence={item.field.confidence} />
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      {actionLoading === item.field.id ? (
                        <div className="w-5 h-5 border-2 border-[#D4FF00] border-t-transparent rounded-full animate-spin ml-auto" />
                      ) : editingId === item.field.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="px-3 py-1.5 bg-[#D4FF00] text-black text-xs font-extrabold rounded-lg cursor-pointer"
                            onClick={() => handleAction(item, "edit")}
                            disabled={!editValue.trim()}
                          >
                            Save
                          </button>
                          <button
                            className="px-3 py-1.5 bg-[#232532] text-gray-300 text-xs rounded-lg cursor-pointer"
                            onClick={() => { setEditingId(null); setEditValue(""); }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="px-3 py-1.5 bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30 hover:bg-[#D4FF00]/25 text-xs font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                            onClick={() => handleAction(item, "accept")}
                          >
                            <Check size={13} /> Accept
                          </button>
                          <button
                            className="px-3 py-1.5 bg-[#232532] text-gray-300 hover:bg-[#303344] text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                            onClick={() => { setEditingId(item.field.id); setEditValue(String(item.field.value ?? "")); }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            className="px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 text-xs font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                            onClick={() => handleAction(item, "reject")}
                          >
                            <X size={13} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
