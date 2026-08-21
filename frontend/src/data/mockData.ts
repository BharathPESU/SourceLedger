import { ProductRecord, IngestionSource, CategoryOverview } from '../types';

export const INITIAL_PRODUCTS: ProductRecord[] = [
  {
    id: 'prod-001',
    sku: 'SNY-WH1000XM5-SLV',
    name: 'WH-1000XM5 Wireless Noise-Cancelling Headphones',
    brand: 'Sony',
    category: 'Audio & Acoustic',
    confidence: 68,
    confidenceLevel: 'medium',
    status: 'needs_review',
    lastUpdated: '12 mins ago',
    sourceDocument: 'Sony_Audio_Datasheet_2026_Rev2.pdf',
    fieldsCount: 8,
    fieldsReviewedCount: 5,
    specsSummary: 'Dual Processor V1, 30h battery life, 8 microphones, 30mm carbon fiber driver',
    conflictsSummary: 'Frequency response range in PDF table (4 Hz - 40 kHz) conflicts with marketing bullet (20 Hz - 20 kHz active).',
    fields: [
      {
        id: 'f-101',
        name: 'Frequency Response (Active)',
        value: '4 Hz - 40,000 Hz',
        confidence: 64,
        confidenceLevel: 'medium',
        sourceDocument: 'Sony_Audio_Datasheet_2026_Rev2.pdf',
        sourcePage: 3,
        sourceSection: 'Table 2.4 - Acoustic Transducer Characteristics',
        sourceExcerpt: '"Acoustic Range (Active Wired / JEITA): 4 Hz – 40,000 Hz. Bluetooth LDAC mode: 20 Hz – 40,000 Hz (Sampling 96 kHz)."',
        aiReasoning: 'Ambiguity detected: Active wired input supports 4Hz-40kHz, but Bluetooth A2DP stream is capped at 20Hz-20kHz under SBC codec. Requires human review to pick canonical catalog representation.',
        fieldType: 'text'
      },
      {
        id: 'f-102',
        name: 'Battery Life (ANC ON)',
        value: '30 Hours',
        confidence: 96,
        confidenceLevel: 'high',
        sourceDocument: 'Sony_Audio_Datasheet_2026_Rev2.pdf',
        sourcePage: 4,
        sourceSection: 'Power Consumption & Battery Specifications',
        sourceExcerpt: '"Continuous playback with Active Noise Cancellation enabled: Max. 30 hours (AAC) / Max. 24 hours (LDAC)."',
        aiReasoning: 'Standard IEC runtime verified across 3 distinct tables. High certainty rating.',
        fieldType: 'text'
      },
      {
        id: 'f-103',
        name: 'Driver Unit Diameter',
        value: '30 mm',
        confidence: 98,
        confidenceLevel: 'high',
        sourceDocument: 'Sony_Audio_Datasheet_2026_Rev2.pdf',
        sourcePage: 2,
        sourceSection: 'Mechanical & Transducer Overview',
        sourceExcerpt: '"Driver: 30mm precision-engineered dome with carbon fiber composite diaphragm."',
        aiReasoning: 'Direct attribute extraction from official spec matrix with 100% semantic alignment.',
        fieldType: 'dimension'
      },
      {
        id: 'f-104',
        name: 'Weight',
        value: '250 g',
        confidence: 95,
        confidenceLevel: 'high',
        sourceDocument: 'Sony_Audio_Datasheet_2026_Rev2.pdf',
        sourcePage: 2,
        sourceSection: 'Physical Dimensions',
        sourceExcerpt: '"Approx. 250 g (8.82 oz) excluding connection cable."',
        aiReasoning: 'Mass extracted and normalized to grams unit format standard.',
        fieldType: 'dimension'
      },
      {
        id: 'f-105',
        name: 'Bluetooth Version',
        value: 'v5.2',
        confidence: 88,
        confidenceLevel: 'medium',
        sourceDocument: 'Sony_Audio_Datasheet_2026_Rev2.pdf',
        sourcePage: 5,
        sourceSection: 'Wireless Connectivity Matrix',
        sourceExcerpt: '"Bluetooth Specification Version 5.2. Power Class 1. Frequency 2.4 GHz band."',
        aiReasoning: 'Extracted version string validated against Bluetooth SIG qualification database.',
        fieldType: 'text'
      },
      {
        id: 'f-106',
        name: 'Fast Charging Time',
        value: '3 min charge = 3 hours playback',
        confidence: 92,
        confidenceLevel: 'high',
        sourceDocument: 'Sony_Audio_Datasheet_2026_Rev2.pdf',
        sourcePage: 4,
        sourceSection: 'USB Power Delivery Protocol',
        sourceExcerpt: '"With optional USB-PD AC adapter: 3 minutes charging yields up to 3 hours of continuous playback."',
        aiReasoning: 'Extracted USB-PD fast charge specification. Conditional clause preserved.',
        fieldType: 'text'
      }
    ]
  },
  {
    id: 'prod-002',
    sku: 'SIE-S71200-CPU1214C',
    name: 'SIMATIC S7-1200 Compact CPU 1214C DC/DC/DC',
    brand: 'Siemens',
    category: 'Industrial',
    confidence: 94,
    confidenceLevel: 'high',
    status: 'auto_committed',
    lastUpdated: '25 mins ago',
    sourceDocument: 'Siemens_Industry_Mall_Export_Q3.csv',
    fieldsCount: 12,
    fieldsReviewedCount: 12,
    specsSummary: '14 DI 24V DC, 10 DO 24V DC, 2 AI 0-10V DC, 100 KB work memory',
    fields: [
      {
        id: 'f-201',
        name: 'Supply Voltage',
        value: '24 V DC (20.4 - 28.8 V DC permissible)',
        confidence: 99,
        confidenceLevel: 'high',
        sourceDocument: 'Siemens_Industry_Mall_Export_Q3.csv',
        sourceExcerpt: '"Rated value (DC): 24 V. Permissible range, lower limit: 20.4 V. Upper limit: 28.8 V."',
        aiReasoning: 'Industrial standard voltage tolerance matched to IEC 61131-2 Type 1.',
        fieldType: 'electrical'
      },
      {
        id: 'f-202',
        name: 'Integrated Work Memory',
        value: '100 KB',
        confidence: 97,
        confidenceLevel: 'high',
        sourceDocument: 'Siemens_Industry_Mall_Export_Q3.csv',
        sourceExcerpt: '"Work memory integrated: 100 kbyte; expandable via SIMATIC Memory Card."',
        aiReasoning: 'Memory capacity confirmed against hardware engineering manual rev 4.5.',
        fieldType: 'text'
      },
      {
        id: 'f-203',
        name: 'Digital Inputs / Outputs',
        value: '14 DI / 10 DO (Transistor)',
        confidence: 98,
        confidenceLevel: 'high',
        sourceDocument: 'Siemens_Industry_Mall_Export_Q3.csv',
        sourceExcerpt: '"Number of digital inputs: 14; 6 inputs to INT; Number of digital outputs: 10; Transistor."',
        aiReasoning: 'I/O point count and output switching typology unambiguously parsed.',
        fieldType: 'text'
      }
    ]
  },
  {
    id: 'prod-003',
    sku: 'TEX-TPS65987D-Q1',
    name: 'Automotive USB Type-C & PD Controller',
    brand: 'Texas Instruments',
    category: 'Electronics',
    confidence: 54,
    confidenceLevel: 'low',
    status: 'flagged_conflict',
    lastUpdated: '42 mins ago',
    sourceDocument: 'TI_TPS65987D_Automotive_Spec.pdf',
    fieldsCount: 10,
    fieldsReviewedCount: 3,
    specsSummary: 'AEC-Q100 Grade 1, Dual port, Integrated 5A Power Switch',
    conflictsSummary: 'Operating junction temperature range discrepancy between automotive AEC-Q100 (-40°C to 125°C) and generic industrial datasheet (-40°C to 85°C).',
    fields: [
      {
        id: 'f-301',
        name: 'Operating Junction Temp (Tj)',
        value: '-40°C to 125°C',
        confidence: 52,
        confidenceLevel: 'low',
        sourceDocument: 'TI_TPS65987D_Automotive_Spec.pdf',
        sourcePage: 6,
        sourceSection: 'Absolute Maximum Ratings & Recommended Operating Conditions',
        sourceExcerpt: '"Automotive Qualification Grade 1: -40°C <= Tj <= 125°C. Industrial variant TPS65987D rated to 85°C ambient."',
        aiReasoning: 'Discrepancy: Part number has "-Q1" suffix denoting AEC-Q100 automotive grade, but base document contains shared table with non-Q1 commercial tier. Human confirmation required.',
        fieldType: 'text'
      },
      {
        id: 'f-302',
        name: 'Internal Power Switch Rds(on)',
        value: '24 mΩ',
        confidence: 76,
        confidenceLevel: 'medium',
        sourceDocument: 'TI_TPS65987D_Automotive_Spec.pdf',
        sourcePage: 8,
        sourceSection: 'Electrical Characteristics - VBUS Power Switches',
        sourceExcerpt: '"Internal 24-mΩ typ Rds(on) high-side N-channel FET with reverse current protection."',
        aiReasoning: 'Extracted typical resistance value. Max ceiling is 36mΩ at 125°C.',
        fieldType: 'electrical'
      },
      {
        id: 'f-303',
        name: 'Package / Pinout',
        value: 'VQFN-56 (7x7mm, 0.4mm pitch)',
        confidence: 94,
        confidenceLevel: 'high',
        sourceDocument: 'TI_TPS65987D_Automotive_Spec.pdf',
        sourcePage: 1,
        sourceSection: 'Package Description',
        sourceExcerpt: '"56-pin VQFN (RSH) 7.00 mm x 7.00 mm x 0.90 mm with thermal pad."',
        aiReasoning: 'Standard JEDEC footprint verified against mechanical drawing appendix.',
        fieldType: 'dimension'
      }
    ]
  },
  {
    id: 'prod-004',
    sku: 'UR-UR5E-CB5-ARM',
    name: 'UR5e Collaborative Industrial Robot Arm (5kg Payload)',
    brand: 'Universal Robots',
    category: 'Robotics & Automation',
    confidence: 89,
    confidenceLevel: 'medium',
    status: 'needs_review',
    lastUpdated: '1 hour ago',
    sourceDocument: 'UniversalRobots_UR5e_TechSpecs_v5.pdf',
    fieldsCount: 14,
    fieldsReviewedCount: 9,
    specsSummary: '850mm reach, ±0.03mm pose repeatability, 17 safety functions (ISO 13849-1, Cat. 3, PL d)',
    conflictsSummary: 'Tool flange connector type: Revision 5.4 specifies M8 8-pin while legacy catalog says M8 4-pin.',
    fields: [
      {
        id: 'f-401',
        name: 'Payload Capacity',
        value: '5.0 kg (11 lbs)',
        confidence: 99,
        confidenceLevel: 'high',
        sourceDocument: 'UniversalRobots_UR5e_TechSpecs_v5.pdf',
        sourcePage: 1,
        sourceSection: 'Key Specifications Summary',
        sourceExcerpt: '"Payload: 5 kg (11 lbs). Maximum reach: 850 mm (33.5 in)."',
        aiReasoning: 'Unambiguous nominal payload rated under standard ISO 9283 testing.',
        fieldType: 'dimension'
      },
      {
        id: 'f-402',
        name: 'Tool Flange Connection',
        value: 'M8 8-pin (Standard 24V I/O)',
        confidence: 72,
        confidenceLevel: 'medium',
        sourceDocument: 'UniversalRobots_UR5e_TechSpecs_v5.pdf',
        sourcePage: 4,
        sourceSection: 'Tool I/O Connector Interface',
        sourceExcerpt: '"Tool connector: M8 8-pin female connector providing 2x DI, 2x DO, 2x AI (0-10V/4-20mA), 12V/24V power."',
        aiReasoning: 'Previous generation utilized 4-pin connector. Newer e-Series uses 8-pin. Flagged for review to ensure catalog backwards compatibility notes.',
        fieldType: 'text'
      },
      {
        id: 'f-403',
        name: 'Pose Repeatability',
        value: '±0.03 mm',
        confidence: 96,
        confidenceLevel: 'high',
        sourceDocument: 'UniversalRobots_UR5e_TechSpecs_v5.pdf',
        sourcePage: 2,
        sourceSection: 'Performance Parameters',
        sourceExcerpt: '"Pose repeatability per ISO 9283: ±0.03 mm (±0.0012 in)."',
        aiReasoning: 'Standard ISO metric extraction confirmed.',
        fieldType: 'dimension'
      }
    ]
  },
  {
    id: 'prod-005',
    sku: 'CRE-XLAMP-XHP70-3',
    name: 'XLamp XHP70.3 High-Density LED Emitter',
    brand: 'Cree LED',
    category: 'Commercial Lighting',
    confidence: 95,
    confidenceLevel: 'high',
    status: 'auto_committed',
    lastUpdated: '2 hours ago',
    sourceDocument: 'Cree_XHP70.3_Datasheet_CLD-DS265.pdf',
    fieldsCount: 9,
    fieldsReviewedCount: 9,
    specsSummary: 'Up to 5300 lm @ 45W, 7.0 x 7.0 mm footprint, 6V/12V configurable PCB',
    fields: [
      {
        id: 'f-501',
        name: 'Maximum Light Output',
        value: '5,300 lumens @ 45 W',
        confidence: 96,
        confidenceLevel: 'high',
        sourceDocument: 'Cree_XHP70.3_Datasheet_CLD-DS265.pdf',
        sourceExcerpt: '"Max output @ 85°C binning: 5300 lm at maximum drive current."',
        aiReasoning: 'Luminous flux extracted from Table 1 with standardized 85°C test junction.',
        fieldType: 'number'
      },
      {
        id: 'f-502',
        name: 'Footprint Size',
        value: '7.0 x 7.0 mm',
        confidence: 98,
        confidenceLevel: 'high',
        sourceDocument: 'Cree_XHP70.3_Datasheet_CLD-DS265.pdf',
        sourceExcerpt: '"Standard 7070 SMD footprint with isolated thermal path."',
        aiReasoning: 'Direct dimension extraction matching EIA package classification.',
        fieldType: 'dimension'
      }
    ]
  },
  {
    id: 'prod-006',
    sku: 'MED-INF-PLUS-V4',
    name: 'SmartInfuse Pro Automated Infusion Pump',
    brand: 'B. Braun Medical',
    category: 'Medical Systems',
    confidence: 62,
    confidenceLevel: 'low',
    status: 'needs_review',
    lastUpdated: '3 hours ago',
    sourceDocument: 'Braun_Infusion_Manual_EN_2026.pdf',
    fieldsCount: 16,
    fieldsReviewedCount: 6,
    specsSummary: 'Flow rate 0.1 - 1200 mL/h, Dose Error Reduction System, Wi-Fi 6 HL7 interface',
    conflictsSummary: 'Flow rate precision variance (±2% vs ±5%) depending on dedicated vs generic IV administration tubing lines.',
    fields: [
      {
        id: 'f-601',
        name: 'Delivery Rate Accuracy',
        value: '±2% with dedicated lines / ±5% standard',
        confidence: 61,
        confidenceLevel: 'low',
        sourceDocument: 'Braun_Infusion_Manual_EN_2026.pdf',
        sourceExcerpt: '"Volumetric delivery accuracy: ±2% when utilizing OEM Lines. Accuracy falls to ±5% for uncalibrated generic sets."',
        aiReasoning: 'Critical medical specification with conditional accuracy ranges. Requires catalog editor approval for regulatory compliance.',
        fieldType: 'text'
      }
    ]
  },
  {
    id: 'prod-007',
    sku: 'BOS-GSR-18V-150C',
    name: 'BITURBO Brushless 18V Drill Driver GSR 18V-150 C',
    brand: 'Bosch Professional',
    category: 'Industrial',
    confidence: 97,
    confidenceLevel: 'high',
    status: 'auto_committed',
    lastUpdated: '4 hours ago',
    sourceDocument: 'Bosch_PowerTools_Catalog_Q2.json',
    fieldsCount: 11,
    fieldsReviewedCount: 11,
    specsSummary: '150 Nm max torque, KickBack Control, Bluetooth connectivity module',
    fields: [
      {
        id: 'f-701',
        name: 'Max Hard Torque',
        value: '150 Nm',
        confidence: 99,
        confidenceLevel: 'high',
        sourceDocument: 'Bosch_PowerTools_Catalog_Q2.json',
        sourceExcerpt: '"Torque (hard/soft): 150 / 84 Nm in accordance with ISO 5393."',
        aiReasoning: 'Standardized torque rating extracted cleanly from JSON spec key.',
        fieldType: 'dimension'
      }
    ]
  },
  {
    id: 'prod-008',
    sku: 'STM-STM32H7A3ZI-MCU',
    name: 'High-Performance ARM Cortex-M7 280MHz MCU',
    brand: 'STMicroelectronics',
    category: 'Electronics',
    confidence: 93,
    confidenceLevel: 'high',
    status: 'auto_committed',
    lastUpdated: '5 hours ago',
    sourceDocument: 'STMicro_STM32H7_ReferenceManual.pdf',
    fieldsCount: 15,
    fieldsReviewedCount: 15,
    specsSummary: '2MB Dual-bank Flash, 1.4MB RAM, Octo-SPI, 3x 16-bit ADCs',
    fields: [
      {
        id: 'f-801',
        name: 'Core Frequency',
        value: '280 MHz (1414 CoreMark)',
        confidence: 98,
        confidenceLevel: 'high',
        sourceDocument: 'STMicro_STM32H7_ReferenceManual.pdf',
        sourceExcerpt: '"32-bit Arm Cortex-M7 core with double-precision FPU, up to 280 MHz clock frequency."',
        aiReasoning: 'CPU clock speed matched across datasheet title and architecture diagram.',
        fieldType: 'text'
      }
    ]
  }
];

export const INITIAL_SOURCES: IngestionSource[] = [
  {
    id: 'src-1',
    name: 'Sony Commercial Audio Product Lineup 2026',
    fileName: 'Sony_Audio_Datasheet_2026_Rev2.pdf',
    fileType: 'PDF Datasheet',
    fileSize: '14.8 MB',
    recordsCount: 42,
    extractedFieldsCount: 380,
    status: 'completed',
    avgConfidence: 89.2,
    category: 'Audio & Acoustic',
    timestamp: 'Today at 06:45 AM',
    processingTimeSec: 14.2,
    aiModelUsed: 'Gemini 2.5 Flash Multimodal OCR'
  },
  {
    id: 'src-2',
    name: 'Mouser Industrial Automation Sync',
    fileName: 'Siemens_Industry_Mall_Export_Q3.csv',
    fileType: 'CSV Batch',
    fileSize: '88.4 MB',
    recordsCount: 1840,
    extractedFieldsCount: 22400,
    status: 'completed',
    avgConfidence: 96.7,
    category: 'Industrial',
    timestamp: 'Today at 04:12 AM',
    processingTimeSec: 64.8,
    aiModelUsed: 'Gemini 2.5 Flash Structured Schema Extractor'
  },
  {
    id: 'src-3',
    name: 'Texas Instruments Automotive Component Matrix',
    fileName: 'TI_TPS65987D_Automotive_Spec.pdf',
    fileType: 'PDF Datasheet',
    fileSize: '6.2 MB',
    recordsCount: 18,
    extractedFieldsCount: 198,
    status: 'completed',
    avgConfidence: 74.5,
    category: 'Electronics',
    timestamp: 'Yesterday at 11:30 PM',
    processingTimeSec: 8.7,
    aiModelUsed: 'Gemini 2.5 Pro High-Precision Reasoning'
  },
  {
    id: 'src-4',
    name: 'Universal Robots Collaborative Robotics Guide',
    fileName: 'UniversalRobots_UR5e_TechSpecs_v5.pdf',
    fileType: 'PDF Datasheet',
    fileSize: '22.1 MB',
    recordsCount: 12,
    extractedFieldsCount: 168,
    status: 'completed',
    avgConfidence: 88.4,
    category: 'Robotics & Automation',
    timestamp: 'Yesterday at 08:15 PM',
    processingTimeSec: 19.3,
    aiModelUsed: 'Gemini 2.5 Flash Multimodal OCR'
  },
  {
    id: 'src-5',
    name: 'DigiKey Live Supplier API Feed (Active Queue)',
    fileName: 'api.digikey.com/v3/catalog/realtime',
    fileType: 'Supplier API',
    fileSize: 'Live Stream',
    recordsCount: 650,
    extractedFieldsCount: 7800,
    status: 'processing',
    avgConfidence: 91.8,
    category: 'Electronics',
    timestamp: 'Just now',
    processingTimeSec: 3.1,
    aiModelUsed: 'Gemini 2.5 Flash API Streamer'
  }
];

export const CATEGORY_OVERVIEWS: CategoryOverview[] = [
  {
    id: 'cat-1',
    name: 'Electronics & Chips',
    iconName: 'Cpu',
    totalRecords: 12450,
    validatedRecords: 11620,
    needsReviewCount: 830,
    avgConfidence: 94.2,
    accentColor: 'orange'
  },
  {
    id: 'cat-2',
    name: 'Industrial Automation',
    iconName: 'Factory',
    totalRecords: 6890,
    validatedRecords: 6410,
    needsReviewCount: 480,
    avgConfidence: 96.1,
    accentColor: 'charcoal'
  },
  {
    id: 'cat-3',
    name: 'Audio & Acoustics',
    iconName: 'Headphones',
    totalRecords: 2430,
    validatedRecords: 2010,
    needsReviewCount: 420,
    avgConfidence: 86.8,
    accentColor: 'cream'
  },
  {
    id: 'cat-4',
    name: 'Robotics & Motion',
    iconName: 'Bot',
    totalRecords: 1640,
    validatedRecords: 1480,
    needsReviewCount: 160,
    avgConfidence: 92.5,
    accentColor: 'orange'
  },
  {
    id: 'cat-5',
    name: 'Commercial Lighting',
    iconName: 'Lightbulb',
    totalRecords: 1440,
    validatedRecords: 1390,
    needsReviewCount: 50,
    avgConfidence: 97.4,
    accentColor: 'charcoal'
  }
];

export const CATALOG_METRICS = {
  totalRecords: 24850,
  autoCommittedCount: 22910,
  autoCommittedPercentage: 92.2,
  needsReviewCount: 1940,
  needsReviewPercentage: 7.8,
  avgConfidence: 94.8,
  activeSourcesCount: 142,
  ingestedTodayCount: 1250,
  humanCorrectionsToday: 48,
  accuracyRate: 99.4
};
