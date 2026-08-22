import React from 'react';
import { 
  UploadCloud, 
  FileText, 
  Database, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { IngestionSource } from '../types';
import { StatusPill } from './StatusPill';

interface IngestionSourcesViewProps {
  sources: IngestionSource[];
  onOpenIngestModal: () => void;
}

export const IngestionSourcesView: React.FC<IngestionSourcesViewProps> = ({
  sources,
  onOpenIngestModal
}) => {
  return (
    <div className="space-y-6 pb-16">
      {/* Header - Frosted Glass Card */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-[#E8622C] text-xs font-bold uppercase tracking-wider mb-2 border border-white/70 shadow-2xs">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Ingestion Pipelines & Feeds</span>
          </div>
          <h1 className="font-didone font-bold text-2xl sm:text-3xl text-[#191715] tracking-tight">
            Active Data Sources & <span className="font-didone-italic text-[#E8622C] font-normal">Feeds</span>
          </h1>
          <p className="text-sm text-[#5C554D] mt-1 max-w-xl">
            Manage incoming manufacturer datasheets, supplier CSV feeds, API webhooks, and PDF catalogs parsed by Ledger multimodal extraction pipelines.
          </p>
        </div>

        <button
          onClick={onOpenIngestModal}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#E8622C] to-[#D45320] hover:scale-[1.02] text-white text-sm font-bold shadow-md shadow-[#E8622C]/25 border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Connect New Source</span>
        </button>
      </div>

      {/* Sources Grid - Frosted Glass Cards */}
      {sources.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-12 text-center border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.04)] max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF4EB] text-[#E8622C] flex items-center justify-center mx-auto mb-4 border border-[#DFCDBC]/50">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="font-didone font-bold text-xl text-[#191715]">
            No Sources Ingested Yet
          </h3>
          <p className="text-xs text-[#5C554D] mt-1.5 leading-relaxed">
            Ingest your first PDF datasheet, CSV catalog file, or website spec text to activate the Google GenAI extraction pipeline.
          </p>
          <button
            onClick={onOpenIngestModal}
            className="mt-5 px-5 py-2.5 rounded-full bg-[#E8622C] text-white text-xs font-bold shadow-md shadow-[#E8622C]/20 hover:scale-[1.02] transition-all cursor-pointer"
          >
            + Ingest New Source
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sources.map((source) => (
            <div
              key={source.id}
              className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.04)] hover:shadow-lg hover:border-[#E8622C]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white/60 backdrop-blur-md text-[#191715] border border-white/70 shadow-2xs">
                    {source.fileType}
                  </span>
                  <StatusPill type="ingestion" ingestionStatus={source.status} size="sm" />
                </div>

                <h3 className="font-display font-bold text-lg text-[#191715]">
                  {source.name}
                </h3>
                <p className="text-xs font-mono text-[#8C8276] mt-0.5">
                  {source.fileName} ({source.fileSize})
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/60">
                  <div className="p-3 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
                      Extracted Records
                    </span>
                    <span className="font-display font-bold text-base text-[#191715]">
                      {source.recordsCount.toLocaleString()} products
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
                      Avg AI Confidence
                    </span>
                    <span className="font-display font-bold text-base text-[#E8622C]">
                      {source.avgConfidence}%
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 p-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/70 flex items-center gap-2 text-xs text-[#5C554D] shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#E8622C] shrink-0" />
                  <span className="truncate">Pipeline: <strong className="text-[#191715]">{source.aiModelUsed}</strong></span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/60 flex items-center justify-between text-xs text-[#8C8276]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {source.timestamp}
                </span>
                <span className="font-semibold text-[#191715]">
                  {source.extractedFieldsCount.toLocaleString()} fields extracted
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
