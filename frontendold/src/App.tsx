import { NavLink, Route, Routes } from "react-router-dom";
import { LayoutDashboard, Download, CheckSquare, BarChart2, FileSpreadsheet, ShieldAlert, Bell, Clock, SlidersHorizontal } from "lucide-react";
import DashboardPage from "./pages/DashboardPage";
import IngestPage from "./pages/IngestPage";
import ProductPage from "./pages/ProductPage";
import ReviewPage from "./pages/ReviewPage";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0E0F12]">
      {/* ── Financia Top Navigation Bar ────────────────────────────── */}
      <header className="top-navbar">
        {/* Brand Logo */}
        <div className="brand-container">
          <div className="brand-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="brand-title">SourceLedger</span>
        </div>

        {/* Middle Floating Pill Navigation Track */}
        <nav className="nav-pill-track">
          <NavLink to="/" end className={({ isActive }) => `nav-pill-item ${isActive ? "active" : ""}`}>
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>
          <NavLink to="/ingest" className={({ isActive }) => `nav-pill-item ${isActive ? "active" : ""}`}>
            <Download size={16} />
            Ingest Source
          </NavLink>
          <NavLink to="/review" className={({ isActive }) => `nav-pill-item ${isActive ? "active" : ""}`}>
            <CheckSquare size={16} />
            Review Queue
          </NavLink>
          <a href="#analytics" onClick={(e) => e.preventDefault()} className="nav-pill-item opacity-60 cursor-not-allowed">
            <BarChart2 size={16} />
            Analytics
          </a>
          <a href="#export" onClick={(e) => e.preventDefault()} className="nav-pill-item opacity-60 cursor-not-allowed">
            <FileSpreadsheet size={16} />
            Export Data
          </a>
          <a href="#audit" onClick={(e) => e.preventDefault()} className="nav-pill-item opacity-60 cursor-not-allowed">
            <ShieldAlert size={16} />
            Audit Logs
          </a>
        </nav>

        {/* Right Navigation Controls */}
        <div className="nav-right-actions">
          <button className="nav-circle-btn" title="Recent Activity">
            <Clock size={16} />
          </button>
          <button className="nav-circle-btn relative" title="Notifications">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4FF00] rounded-full shadow-[0_0_6px_#D4FF00]" />
          </button>
          <div className="user-avatar-badge" title="User Profile">
            SL
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Canvas ──────────────────────────────────── */}
      <main className="dashboard-wrapper">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/ingest" element={<IngestPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/review" element={<ReviewPage />} />
        </Routes>
      </main>
    </div>
  );
}
