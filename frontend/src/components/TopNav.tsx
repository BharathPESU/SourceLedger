import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Bell, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  FileText, 
  Command,
  X
} from 'lucide-react';
import { ProductRecord } from '../types';

interface TopNavProps {
  onOpenIngestModal: () => void;
  onSelectProduct: (product: ProductRecord) => void;
  products: ProductRecord[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenIngestModal,
  onSelectProduct,
  products,
  searchQuery,
  setSearchQuery,
  setActiveTab
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Quick filtered preview during typing
  const searchResults = searchQuery.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.fields.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.value.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('top-global-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 shrink-0 h-20 w-full flex items-center justify-between px-6 md:px-8 border-b border-[#1A1A1A]/8 bg-[#F5E9D8]/90 backdrop-blur-xl shadow-[0_2px_12px_rgba(26,23,21,0.03)] transition-all">
      {/* Left: Brand Logo & Tag */}
      <div className="flex items-center gap-8 md:gap-12 shrink-0">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-hidden"
        >
          <div className="w-10 h-10 rounded-[14px] bg-[#E8622C] flex items-center justify-center text-white shadow-md shadow-[#E8622C]/25 transition-transform group-hover:scale-105">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-didone text-2xl font-bold tracking-tight text-[#1A1A1A]">
              Source<span className="font-didone-italic text-[#E8622C] font-normal">Ledger</span>
            </span>
          </div>
        </button>

        {/* Center-Left: Rounded Search Bar from Artistic Flair */}
        <div ref={searchContainerRef} className="relative hidden sm:block">
          <div className="relative flex items-center">
            <input
              id="top-global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search records, SKUs, attributes..."
              className="bg-white/40 focus:bg-white/70 text-[#1A1A1A] rounded-full py-2 pl-9 pr-10 w-64 md:w-80 text-sm backdrop-blur-md border border-white/50 focus:border-[#E8622C]/40 focus:ring-2 focus:ring-[#E8622C]/20 outline-hidden placeholder-[#1A1A1A]/40 transition-all shadow-inner"
            />
            <div className="absolute left-3.5 top-2.5 text-[#1A1A1A]/40 pointer-events-none">
              <Search className="w-3.5 h-3.5" />
            </div>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 p-1 rounded-full text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="absolute right-3.5 top-2 opacity-40 pointer-events-none">
                <Command className="w-3.5 h-3.5 text-[#1A1A1A]" />
              </div>
            )}
          </div>

          {/* Live Search Quick Popover */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/80 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white/70 p-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 flex items-center justify-between">
                <span>Matching Records ({searchResults.length})</span>
                <span className="text-[10px] text-[#E8622C] font-bold">Inspect</span>
              </div>
              <div className="divide-y divide-white/60 mt-1">
                {searchResults.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      onSelectProduct(prod);
                      setActiveTab('field_inspector');
                      setIsSearchFocused(false);
                    }}
                    className="w-full text-left p-2.5 hover:bg-white/60 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1A1A1A] truncate">
                          {prod.name}
                        </span>
                        <span className="text-xs text-[#1A1A1A]/50 shrink-0 font-mono">
                          {prod.sku}
                        </span>
                      </div>
                      <p className="text-xs text-[#1A1A1A]/60 truncate mt-0.5">
                        {prod.category} • {prod.brand}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full text-white shadow-xs ${
                        prod.confidence >= 85 ? 'bg-[#E8622C]' : 'bg-[#1A1A1A]'
                      }`}>
                        {prod.confidence}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Notifications, Profile, Action Button */}
      <div className="flex items-center gap-4 md:gap-6 shrink-0">
        <div className="flex items-center gap-3">
          {/* Notifications Button */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-full bg-white/40 hover:bg-white/70 backdrop-blur-md border border-white/60 shadow-xs flex items-center justify-center text-[#1A1A1A] transition-all cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-[#1A1A1A]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-3 w-80 bg-white/85 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white/70 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-black/5">
                  <h4 className="font-display font-black text-sm text-[#1A1A1A]">System Alerts</h4>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#E8622C] text-white">3 New</span>
                </div>
                <div className="space-y-2.5 mt-3">
                  <div className="p-2.5 rounded-2xl bg-white/60 border border-white/60 flex items-start gap-2.5 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-[#E8622C] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#1A1A1A]">Conflict Flagged in Sony Datasheet</p>
                      <p className="text-[11px] text-[#1A1A1A]/60 mt-0.5">Frequency spec conflict in table vs narrative.</p>
                      <span className="text-[10px] text-[#1A1A1A]/40 mt-1 block">12m ago</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/60 border border-white/60 flex items-start gap-2.5 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-[#1F8A53] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#1A1A1A]">Catalog Sync Completed</p>
                      <p className="text-[11px] text-[#1A1A1A]/60 mt-0.5">1,840 records extracted at 96.7% confidence.</p>
                      <span className="text-[10px] text-[#1A1A1A]/40 mt-1 block">45m ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/90 backdrop-blur-md border border-white/20 text-white flex items-center justify-center text-xs font-bold shadow-md">
            JD
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onOpenIngestModal}
          className="bg-gradient-to-r from-[#E8622C] to-[#D45320] text-white px-5 md:px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-[#E8622C]/25 hover:shadow-xl hover:shadow-[#E8622C]/30 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 border border-white/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Ingest New Source</span>
        </button>
      </div>
    </header>
  );
};
