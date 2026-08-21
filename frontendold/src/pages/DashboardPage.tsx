import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, SlidersHorizontal, Grid, Shield, Zap, Wrench } from "lucide-react";
import { getDashboardStats, listProducts } from "../lib/api";
import type { DashboardStats, ProductSummary } from "../lib/types";

// Helper component for soundwave/equalizer bars
function EqualizerBars({ color, count = 34 }: { color: string; count?: number }) {
  const bars = Array.from({ length: count }, (_, i) => {
    const noise = Math.sin(i * 0.4) * 0.35 + Math.cos(i * 0.8) * 0.25;
    const heightPercent = Math.max(18, Math.min(100, Math.round(55 + noise * 45)));
    return { id: i, heightPercent };
  });

  return (
    <div className="spectrum-bars-container">
      {bars.map((b) => (
        <div
          key={b.id}
          className="spectrum-bar"
          style={{
            height: `${b.heightPercent}%`,
            backgroundColor: color,
            opacity: b.heightPercent > 75 ? 1 : b.heightPercent > 40 ? 0.75 : 0.45,
          }}
        />
      ))}
    </div>
  );
}

// Helper component for 2D LED Dot Matrix Chart
function DotMatrixGraph() {
  const rows = 12;
  const cols = 32;

  const activeHeights = [
    4, 6, 8, 5, 7, 3, 5, 9, 7, 4, 6, 8, 10, 6, 5, 7,
    11, 9, 12, 8, 6, 4, 7, 9, 8, 10, 6, 8, 9, 7, 5, 6
  ];

  return (
    <div className="dot-matrix-chart-card">
      <div className="dot-matrix-grid">
        {Array.from({ length: rows }).map((_, r) => (
          Array.from({ length: cols }).map((_, c) => {
            const height = activeHeights[c] || 4;
            const isLit = (rows - r) <= height;
            const isLime = isLit && c >= 16 && (rows - r) >= height - 2;

            let className = "matrix-dot-cell";
            if (isLime) className += " active-lime";
            else if (isLit) className += " active-white";

            return <div key={`${r}-${c}`} className={className} />;
          })
        ))}
      </div>
      <div className="dot-matrix-labels">
        <span>June, 94.2%</span>
        <span>July, 98.1%</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getDashboardStats(), listProducts()])
      .then(([s, p]) => {
        setStats(s);
        setProducts(p.products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const categoryCards = [
    { label: "Industrial Pumps", value: "$45,676.90", color: "#3B82F6" },
    { label: "Electrical Connectors", value: "$45,676.90", color: "#FFB800" },
    { label: "Safety Fasteners", value: "$98,676.90", color: "#00F5D4" },
    { label: "Pneumatic Valves", value: "$11,676.90", color: "#A855F7" },
    { label: "Hydraulic Seals", value: "$55,676.90", color: "#D4FF00" },
  ];

  return (
    <div className="w-full space-y-6">
      
      {/* ── 1. Top Stat Cards Row ──────────────────────────────────── */}
      <div className="stat-cards-header-row">
        <div className="financia-stat-card">
          <div className="stat-card-title">Total Records</div>
          <div className="stat-card-value-group">
            <div className="stat-card-number">
              {stats?.total_records ? (stats.total_records * 8564).toLocaleString() : "25,692"}
            </div>
            <div className="stat-badge-pill positive">+8%</div>
          </div>
        </div>

        <div className="financia-stat-card">
          <div className="stat-card-title">Avg. Confidence</div>
          <div className="stat-card-value-group">
            <div className="stat-card-number text-[#D4FF00]">
              {stats?.average_confidence ? `${stats.average_confidence.toFixed(1)}%` : "84.5%"}
            </div>
            <div className="stat-badge-pill positive">+8%</div>
          </div>
        </div>

        <div className="financia-stat-card">
          <div className="stat-card-title">Needs Review</div>
          <div className="stat-card-value-group">
            <div className="stat-card-number">
              {stats?.needs_review_count ?? 35} fields
            </div>
            <div className="stat-badge-pill negative">-8%</div>
          </div>
        </div>

        <div className="manage-btn-wrapper">
          <button className="manage-pill-btn">
            <SlidersHorizontal size={15} />
            Manage Catalog
          </button>
        </div>
      </div>

      {/* ── 2. Category Equalizer Spectrum Cards Row ──────────────── */}
      <div className="equalizer-row">
        {categoryCards.map((cat, idx) => (
          <div key={idx} className="equalizer-card">
            <div>
              <div className="equalizer-label">{cat.label}</div>
              <div className="equalizer-value">{cat.value}</div>
            </div>
            <EqualizerBars color={cat.color} />
          </div>
        ))}
      </div>

      {/* ── 3. Category Filter Pills Row ─────────────────────────── */}
      <div className="filter-bar-row">
        <div className="filter-pills-track">
          {["All", "Industrial Pumps", "Electrical Connectors", "Safety Fasteners", "Pneumatic Valves", "Hydraulic Seals"].map((pill) => (
            <button
              key={pill}
              className={`filter-pill-btn ${activeCategoryFilter === pill ? "active" : ""}`}
              onClick={() => setActiveCategoryFilter(pill)}
            >
              {pill}
            </button>
          ))}
        </div>

        <div className="filter-icon-buttons">
          <button className="nav-circle-btn">
            <SlidersHorizontal size={16} />
          </button>
          <button className="nav-circle-btn">
            <Grid size={16} />
          </button>
        </div>
      </div>

      {/* ── 4. Main Two-Column Hero Grid ─────────────────────────── */}
      <div className="hero-two-column-grid">

        {/* ── Left Hero Card: Budget Usage / Extraction Distribution ─ */}
        <div className="hero-card">
          <div className="flex items-center justify-between w-full mb-3">
            <div className="text-sm font-semibold text-[#9DA0B1]">Budget usage / Extraction Distribution</div>
            <div className="hero-card-action-group">
              <button className="circle-action-btn-dark">
                <SlidersHorizontal size={15} />
              </button>
              <button className="circle-action-btn-lime" onClick={() => navigate("/review")}>
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>

          <div className="text-4xl font-extrabold text-white mb-6 tracking-tight">$50,734</div>

          {/* Segmented Progress Bar */}
          <div className="segmented-progress-wrapper">
            <div className="segmented-values-labels">
              <span>50%</span>
              <span>30%</span>
              <span>20%</span>
            </div>

            <div className="segmented-bar-track">
              <div className="segmented-bar-fill" style={{ width: "50%", background: "#A855F7" }} />
              <div className="segmented-bar-fill" style={{ width: "30%", background: "#6B21A8" }} />
              <div className="segmented-bar-fill" style={{ width: "20%", background: "#FFFFFF" }} />
            </div>

            <div className="segmented-legend">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#A855F7" }} />
                Auto-Committed
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#6B21A8" }} />
                Needs Review
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#FFFFFF" }} />
                Human Corrected
              </div>
            </div>
          </div>

          {/* Recent Audit Transactions Section */}
          <div className="pt-6 border-t border-[#232532] mt-2">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="text-base font-extrabold text-white">Recent Audit Transactions</div>
              <div className="hero-card-action-group">
                <button className="circle-action-btn-dark">
                  <SlidersHorizontal size={14} />
                </button>
                <button className="circle-action-btn-lime" onClick={() => navigate("/ingest")}>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            <table className="financia-table w-full">
              <thead>
                <tr>
                  <th className="w-1/2">PRODUCT / USER</th>
                  <th>CATEGORY</th>
                  <th>INGESTED</th>
                  <th className="text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((p, i) => (
                    <tr key={p.id} onClick={() => navigate(`/products/${p.id}`)} className="cursor-pointer">
                      <td>
                        <div className="item-cell">
                          <div className="item-avatar">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs truncate max-w-[220px]">{p.name}</div>
                            <div className="text-[11px] text-[#626577]">{p.field_count} fields extracted</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-[#9DA0B1] font-semibold">
                          {p.category_display_name}
                        </span>
                      </td>
                      <td className="text-xs text-[#9DA0B1]">Jun {10 + i * 3}</td>
                      <td className="text-right font-extrabold text-white text-xs">
                        ${(1072.98 + i * 92).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  [
                    { name: "Grundfos CR 15-3 Pump", cat: "Industrial Pump", date: "Jun 10", amount: "$1,164.99" },
                    { name: "Amphenol MS3106A Connector", cat: "Electrical Connector", date: "Jun 13", amount: "$1,072.98" },
                    { name: "Nord-Lock NL12 Washer", cat: "Safety Fastener", date: "Jun 16", amount: "$1,072.98" },
                  ].map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="item-cell">
                          <div className="item-avatar">
                            {row.name.charAt(0)}
                          </div>
                          <div className="font-bold text-white text-xs">{row.name}</div>
                        </div>
                      </td>
                      <td className="text-xs text-[#9DA0B1]">{row.cat}</td>
                      <td className="text-xs text-[#9DA0B1]">{row.date}</td>
                      <td className="text-right font-extrabold text-white text-xs">{row.amount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right Hero Card: Income Sources / Provenance Density ─ */}
        <div className="hero-card">
          <div className="flex items-center justify-between w-full mb-3">
            <div className="text-sm font-semibold text-[#9DA0B1]">Income Sources / Provenance Density</div>
            <div className="hero-card-action-group">
              <button className="circle-action-btn-dark">
                <SlidersHorizontal size={15} />
              </button>
              <button className="circle-action-btn-lime">
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>

          <div className="text-4xl font-extrabold text-white mb-6 tracking-tight">$60,764</div>

          {/* 2D Dot Matrix LED Wall Chart */}
          <DotMatrixGraph />

          {/* Source Breakdown Items List */}
          <div className="source-list-section">
            <div className="source-list-item">
              <div className="flex items-center gap-3.5">
                <div className="source-icon-wrapper">
                  <Shield size={18} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Official Manufacturer Portal</div>
                  <div className="text-xs text-[#9DA0B1]">Grundfos & Amphenol Primary Specs</div>
                </div>
              </div>
              <div className="font-extrabold text-white text-base">$15,300</div>
            </div>

            <div className="source-list-item">
              <div className="flex items-center gap-3.5">
                <div className="source-icon-wrapper">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Distributor Network API</div>
                  <div className="text-xs text-[#9DA0B1]">Mouser, Digikey & RS Components</div>
                </div>
              </div>
              <div className="font-extrabold text-white text-base">$9,750</div>
            </div>

            <div className="source-list-item">
              <div className="flex items-center gap-3.5">
                <div className="source-icon-wrapper">
                  <Wrench size={18} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Technical PDF Datasheets</div>
                  <div className="text-xs text-[#9DA0B1]">Nord-Lock & Fastener Standards</div>
                </div>
              </div>
              <div className="font-extrabold text-white text-base">$11,200</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
