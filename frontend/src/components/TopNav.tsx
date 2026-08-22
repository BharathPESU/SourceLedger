import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Bell, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
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
    <header className="sticky top-0 z-30 shrink-0 w-full px-4 sm:px-6 lg:px-10 pt-3 pb-1">
      <div className="w-full max-w-[1920px] mx-auto h-16 rounded-full bg-white/75 backdrop-blur-2xl border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.06)] px-5 md:px-6 flex items-center justify-between transition-all">
        {/* Left: Brand Logo & Tag */}
        <div className="flex items-center gap-6 md:gap-10 shrink-0">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 group text-left cursor-pointer focus:outline-hidden"
          >
            <div className="w-9 h-9 rounded-full bg-[#E8622C] flex items-center justify-center text-white shadow-md shadow-[#E8622C]/25 transition-transform group-hover:scale-105">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-didone text-xl font-bold tracking-tight text-[#191715]">
                Source<span className="font-didone-italic text-[#E8622C] font-normal">Ledger</span>
              </span>
            </div>
          </button>

          {/* Center-Left: Rounded Search Bar */}
          <div ref={searchContainerRef} className="relative hidden sm:block">
            <div className="relative flex items-center">
              <input
                id="top-global-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search records, SKUs, attributes..."
                className="bg-white/60 focus:bg-white text-[#191715] rounded-full py-1.5 pl-9 pr-10 w-56 md:w-72 text-xs backdrop-blur-md border border-white/70 focus:border-[#E8622C]/40 focus:ring-2 focus:ring-[#E8622C]/20 outline-hidden placeholder-[#8C8276] transition-all shadow-inner"
              />
              <div className="absolute left-3 top-2 text-[#8C8276] pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </div>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-full text-[#8C8276] hover:text-[#191715] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="absolute right-3 top-2 opacity-40 pointer-events-none">
                  <Command className="w-3.5 h-3.5 text-[#8C8276]" />
                </div>
              )}
            </div>

            {/* Live Search Quick Popover */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white p-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8C8276] flex items-center justify-between">
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
                      className="w-full text-left p-2.5 hover:bg-[#FAF4EB] rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#191715] truncate">
                            {prod.name}
                          </span>
                          <span className="text-xs text-[#8C8276] shrink-0 font-mono">
                            {prod.sku}
                          </span>
                        </div>
                        <p className="text-xs text-[#5C554D] truncate mt-0.5">
                          {prod.category} • {prod.brand}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full text-white shadow-xs ${
                          prod.confidence >= 85 ? 'bg-[#E8622C]' : 'bg-[#191715]'
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
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Notifications Button */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 rounded-full bg-white/60 hover:bg-white backdrop-blur-md border border-white/70 shadow-2xs flex items-center justify-center text-[#191715] transition-all cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-[#191715]" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-3 w-80 bg-white/95 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-black/5">
                    <h4 className="font-display font-black text-sm text-[#191715]">System Alerts</h4>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#E8622C] text-white">3 New</span>
                  </div>
                  <div className="space-y-2.5 mt-3">
                    <div className="p-2.5 rounded-2xl bg-[#FAF4EB]/80 border border-white flex items-start gap-2.5 shadow-2xs">
                      <AlertTriangle className="w-4 h-4 text-[#E8622C] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-[#191715]">Conflict Flagged in Datasheet</p>
                        <p className="text-[11px] text-[#5C554D] mt-0.5">Frequency spec conflict in table vs narrative.</p>
                        <span className="text-[10px] text-[#8C8276] mt-1 block">12m ago</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-[#FAF4EB]/80 border border-white flex items-start gap-2.5 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-[#1F8A53] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-[#191715]">Catalog Sync Completed</p>
                        <p className="text-[11px] text-[#5C554D] mt-0.5">1,840 records extracted at 96.7% confidence.</p>
                        <span className="text-[10px] text-[#8C8276] mt-1 block">45m ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            <div className="w-9 h-9 rounded-full bg-[#191715] text-white flex items-center justify-center text-xs font-bold shadow-md">
              JD
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onOpenIngestModal}
            className="bg-gradient-to-r from-[#E8622C] to-[#D45320] text-white px-4 md:px-5 py-2 rounded-full text-xs sm:text-sm font-bold shadow-md shadow-[#E8622C]/25 hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 border border-white/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Ingest New Source</span>
          </button>
        </div>
      </div>
    </header>
  );
};
