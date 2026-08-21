import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Boxes, 
  CheckSquare, 
  ScanLine, 
  Sliders, 
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';
import { ActiveTab } from '../types';

interface LeftRailProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  reviewQueueCount: number;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  activeTab,
  setActiveTab,
  reviewQueueCount
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      shortcut: '1'
    },
    {
      id: 'sources' as ActiveTab,
      label: 'Ingestion & Sources',
      icon: UploadCloud,
      shortcut: '2'
    },
    {
      id: 'catalog' as ActiveTab,
      label: 'Product Catalog',
      icon: Boxes,
      shortcut: '3'
    },
    {
      id: 'review_queue' as ActiveTab,
      label: 'Review Queue',
      icon: CheckSquare,
      badge: reviewQueueCount > 0 ? reviewQueueCount : undefined,
      shortcut: '4'
    },
    {
      id: 'field_inspector' as ActiveTab,
      label: 'Field Inspector',
      icon: ScanLine,
      shortcut: '5'
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings & Model Rules',
      icon: Sliders,
      shortcut: '6'
    }
  ];

  return (
    <aside className="relative z-20 w-20 h-full border-r border-[#1A1A1A]/8 flex flex-col items-center py-6 gap-6 shrink-0 transition-all bg-[#F5E9D8]/60 backdrop-blur-md overflow-y-auto overflow-x-hidden">
      {/* Top Navigation Items */}
      <div className="flex flex-col items-center gap-6 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div key={item.id} className="relative group flex items-center justify-center w-full">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`relative w-12 h-12 rounded-[18px] flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E8622C] text-white shadow-lg shadow-[#E8622C]/30 scale-105'
                    : 'text-[#1A1A1A] opacity-40 hover:opacity-100 hover:bg-[#EBDCC5]/40'
                }`}
                aria-label={item.label}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />

                {/* Badge for counts */}
                {item.badge !== undefined && (
                  <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-white shadow-xs ${
                    isActive ? 'bg-[#1A1A1A] text-white' : 'bg-[#E8622C] text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Tooltip on hover */}
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1A1A1A] text-[#FAF4EB] text-xs font-semibold rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap flex items-center gap-2">
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-[#8C8276] px-1 py-0.2 bg-white/10 rounded">
                    {item.shortcut}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom info button / hint */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <div className="relative group">
          <button
            onClick={() => setActiveTab('settings')}
            className="w-12 h-12 rounded-[18px] text-[#1A1A1A] opacity-40 hover:opacity-100 hover:bg-[#EBDCC5]/40 flex items-center justify-center transition-all cursor-pointer"
            title="System Settings & Guidelines"
          >
            <Sliders className="w-5 h-5 stroke-[2]" />
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1A1A1A] text-[#FAF4EB] text-xs font-semibold rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
            Settings & Model Rules
          </div>
        </div>
      </div>
    </aside>
  );
};
