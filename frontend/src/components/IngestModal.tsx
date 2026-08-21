import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Cpu, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { ProductRecord, IngestionSource } from '../types';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestSuccess: (newProduct: ProductRecord, newSource: IngestionSource) => void;
}

export const IngestModal: React.FC<IngestModalProps> = ({
  isOpen,
  onClose,
  onIngestSuccess
}) => {
  const [sourceName, setSourceName] = useState('');
  const [category, setCategory] = useState<'Electronics' | 'Industrial' | 'Audio & Acoustic' | 'Robotics & Automation'>('Electronics');
  const [fileType, setFileType] = useState<'PDF Datasheet' | 'CSV Batch' | 'Supplier API'>('PDF Datasheet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<number>(0);
  const [extractedPreview, setExtractedPreview] = useState<ProductRecord | null>(null);

  if (!isOpen) return null;

  const samplePresets = [
    {
      name: 'NXP LPC55S69 Dual-Core ARM Cortex-M33 MCU',
      fileName: 'NXP_LPC55S69_Datasheet_Rev4.pdf',
      category: 'Electronics' as const,
      type: 'PDF Datasheet' as const,
      sku: 'NXP-LPC55S69JBD100',
      brand: 'NXP Semiconductors',
      confidence: 96,
      specs: '150 MHz Dual-core Arm Cortex-M33, TrustZone, 640 KB Flash, 320 KB SRAM, USB High Speed'
    },
    {
      name: 'Keyence LR-X Series CMOS Multi-Surface Laser Sensor',
      fileName: 'Keyence_LR_X_Sensor_Catalog.pdf',
      category: 'Industrial' as const,
      type: 'PDF Datasheet' as const,
      sku: 'KEY-LR-X50',
      brand: 'Keyence',
      confidence: 72,
      specs: 'Detects transparent/reflective targets, 25-500mm range, IP69K stainless enclosure, IO-Link v1.1'
    }
  ];

  const handleSelectPreset = (preset: typeof samplePresets[0]) => {
    setSourceName(preset.name);
    setCategory(preset.category);
    setFileType(preset.type);
    runExtractionSimulation(preset);
  };

  const runExtractionSimulation = (presetData?: typeof samplePresets[0]) => {
    setIsProcessing(true);
    setProcessStep(1);

    const targetPreset = presetData || {
      name: sourceName || 'Custom Ingested Product Specification',
      fileName: 'Custom_Source_Datasheet.pdf',
      category: category,
      type: fileType,
      sku: `GEN-${Math.floor(1000 + Math.random() * 9000)}-X`,
      brand: 'Global Manufacturer',
      confidence: 91,
      specs: 'High-efficiency industrial controller with smart diagnostic bus interface.'
    };

    // Step 1: Multimodal OCR & Layout Analysis
    setTimeout(() => {
      setProcessStep(2);
      // Step 2: Table & Spec Matrix Extraction
      setTimeout(() => {
        setProcessStep(3);
        // Step 3: Confidence Scoring & Normalization
        setTimeout(() => {
          setProcessStep(4);
          
          const newProduct: ProductRecord = {
            id: `prod-${Date.now()}`,
            sku: targetPreset.sku,
            name: targetPreset.name,
            brand: targetPreset.brand,
            category: targetPreset.category,
            confidence: targetPreset.confidence,
            confidenceLevel: targetPreset.confidence >= 85 ? 'high' : 'medium',
            status: targetPreset.confidence >= 85 ? 'auto_committed' : 'needs_review',
            lastUpdated: 'Just now',
            sourceDocument: targetPreset.fileName,
            fieldsCount: 8,
            fieldsReviewedCount: targetPreset.confidence >= 85 ? 8 : 4,
            specsSummary: targetPreset.specs,
            fields: [
              {
                id: `f-${Date.now()}-1`,
                name: 'Core Processor Architecture',
                value: targetPreset.specs.split(',')[0] || 'High Performance RISC',
                confidence: targetPreset.confidence,
                confidenceLevel: 'high',
                sourceDocument: targetPreset.fileName,
                sourcePage: 1,
                sourceSection: 'Key Architecture Matrix',
                sourceExcerpt: `"System Architecture: ${targetPreset.specs}"`,
                aiReasoning: 'Extracted from page 1 executive summary table with verified IEC alignment.',
                fieldType: 'text'
              },
              {
                id: `f-${Date.now()}-2`,
                name: 'Enclosure Rating & Environment',
                value: 'IP67 / Industrial Grade (-40°C to +85°C)',
                confidence: 94,
                confidenceLevel: 'high',
                sourceDocument: targetPreset.fileName,
                sourcePage: 3,
                sourceSection: 'Environmental Characteristics',
                sourceExcerpt: '"Environmental compliance: Ingress protection IP67; Operating ambient: -40°C to 85°C."',
                aiReasoning: 'Standard IEC 60529 rating extracted unambiguously.',
                fieldType: 'text'
              }
            ]
          };

          const newSource: IngestionSource = {
            id: `src-${Date.now()}`,
            name: targetPreset.name,
            fileName: targetPreset.fileName,
            fileType: targetPreset.type,
            fileSize: '8.4 MB',
            recordsCount: 1,
            extractedFieldsCount: 8,
            status: 'completed',
            avgConfidence: targetPreset.confidence,
            category: targetPreset.category,
            timestamp: 'Just now',
            processingTimeSec: 4.2,
            aiModelUsed: 'Gemini 2.5 Flash Multimodal OCR'
          };

          setExtractedPreview(newProduct);
          setIsProcessing(false);
          onIngestSuccess(newProduct, newSource);
        }, 1200);
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#191715]/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/90 ring-1 ring-white/60 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/60 hover:bg-white/90 backdrop-blur-md text-[#8C8276] hover:text-[#191715] border border-white/70 shadow-2xs transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-[#E8622C] text-xs font-bold uppercase tracking-wider mb-2 border border-white/70 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multimodal Gemini Ingestion</span>
          </div>
          <h2 className="font-didone font-bold text-2xl text-[#191715] tracking-tight">
            Ingest New <span className="font-didone-italic text-[#E8622C] font-normal">Product Source</span>
          </h2>
          <p className="text-xs text-[#5C554D] mt-1 leading-relaxed">
            Upload manufacturer PDF spec sheets, supplier CSV tables, or CAD BOM exports. Gemini will extract, normalize, and score confidence on every attribute.
          </p>
        </div>

        {!isProcessing && !extractedPreview ? (
          <div className="space-y-5">
            {/* Drag and Drop Zone - Frosted Glass Box */}
            <div
              onClick={() => runExtractionSimulation()}
              className="border-2 border-dashed border-white/90 hover:border-[#E8622C] bg-white/50 backdrop-blur-md hover:bg-white/70 rounded-3xl p-6 text-center shadow-inner transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md shadow-xs mx-auto flex items-center justify-center text-[#E8622C] group-hover:scale-110 border border-white/80 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="font-display font-bold text-sm text-[#191715] mt-3">
                Drop PDF datasheets, CSV, or JSON here
              </p>
              <p className="text-xs text-[#8C8276] mt-0.5">
                or click to browse files (PDF, CSV, XLSX, JSON up to 100MB)
              </p>
            </div>

            {/* Quick 1-Click Sample Presets */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8276] block mb-2">
                Or try a realistic sample datasheet:
              </span>
              <div className="space-y-2">
                {samplePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full text-left p-3 rounded-2xl bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/80 shadow-2xs flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[#191715] truncate block">
                        {preset.name}
                      </span>
                      <span className="text-[11px] text-[#8C8276] font-mono">
                        {preset.fileName} • {preset.category}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#E8622C] shrink-0 flex items-center gap-1">
                      Ingest <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : isProcessing ? (
          /* Live AI Pipeline Steps Simulator */
          <div className="py-6 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#E8622C] text-white mx-auto flex items-center justify-center animate-bounce shadow-lg shadow-[#E8622C]/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#191715] mt-3">
                Analyzing Product Specification...
              </h3>
              <p className="text-xs text-[#8C8276] mt-0.5">
                Gemini Multimodal OCR Pipeline Active
              </p>
            </div>

            {/* Progress Checklist - Frosted Glass Container */}
            <div className="space-y-3 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-2xs">
              <div className="flex items-center gap-3 text-xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  processStep >= 1 ? 'bg-[#1F8A53] text-white' : 'bg-white/60 text-[#8C8276]'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className={processStep >= 1 ? 'font-bold text-[#191715]' : 'text-[#8C8276]'}>
                  Optical Layout & Multi-Column Table Parsing
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  processStep >= 2 ? 'bg-[#1F8A53] text-white' : 'bg-white/60 text-[#8C8276]'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className={processStep >= 2 ? 'font-bold text-[#191715]' : 'text-[#8C8276]'}>
                  Electrical & Mechanical Attribute Extraction
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  processStep >= 3 ? 'bg-[#1F8A53] text-white' : 'bg-white/60 text-[#8C8276]'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className={processStep >= 3 ? 'font-bold text-[#191715]' : 'text-[#8C8276]'}>
                  Calculating Confidence Scores & Provenance Offsets
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#EAF5EE]/90 backdrop-blur-md text-[#1F8A53] border border-[#1F8A53]/20 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-xl text-[#191715]">
                Source Successfully Ingested!
              </h3>
              <p className="text-xs text-[#5C554D] mt-1">
                <strong>{extractedPreview?.name}</strong> has been added to your catalog ledger with {extractedPreview?.confidence}% confidence.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E8622C] to-[#D45320] hover:scale-[1.02] text-white font-bold text-xs shadow-md shadow-[#E8622C]/25 border border-white/20 transition-all cursor-pointer"
            >
              Open in Field Inspector
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
