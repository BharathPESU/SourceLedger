export interface TrendAnnotation {
  type: 'spike' | 'dip' | 'milestone' | 'steady';
  title: string;
  cause: string;
  impact: string;
  badge: string;
  sourceType?: string;
}

export interface DailyTrendPoint {
  date: string;
  day: number;
  confidence: number;
  confidenceDelta: number; // change from previous day
  autoCommitRate: number;
  resolvedConflicts: number;
  healthIndex: number;
  totalSkus: number;
  annotation?: TrendAnnotation;
}

export const generate30DayTrendData = (): DailyTrendPoint[] => {
  const data: DailyTrendPoint[] = [
    { 
      date: 'Jul 23', day: 1, confidence: 64.2, confidenceDelta: 0, autoCommitRate: 48.0, resolvedConflicts: 12, healthIndex: 61.5, totalSkus: 840,
      annotation: {
        type: 'milestone',
        title: 'Pipeline Baseline Inception',
        cause: 'Initial multimodal catalog ingestion pipeline launched across industrial component catalogs.',
        impact: 'Baseline confidence score calibrated at 64.2% across 840 active SKUs.',
        badge: 'Baseline Setup',
        sourceType: 'System Core'
      }
    },
    { 
      date: 'Jul 24', day: 2, confidence: 65.1, confidenceDelta: +0.9, autoCommitRate: 49.5, resolvedConflicts: 18, healthIndex: 63.0, totalSkus: 890 
    },
    { 
      date: 'Jul 25', day: 3, confidence: 64.8, confidenceDelta: -0.3, autoCommitRate: 51.0, resolvedConflicts: 25, healthIndex: 63.8, totalSkus: 940,
      annotation: {
        type: 'dip',
        title: 'Legacy Distributor PDF Influx',
        cause: 'Batch ingestion of 50 scanned unformatted legacy distributor catalog sheets with low-res OCR fidelity.',
        impact: 'Introduced 25 ambiguous tolerance fields, temporarily dipping confidence by 0.3%.',
        badge: 'Ingestion Dip (-0.3%)',
        sourceType: 'Distributor Feed'
      }
    },
    { 
      date: 'Jul 26', day: 4, confidence: 66.5, confidenceDelta: +1.7, autoCommitRate: 53.2, resolvedConflicts: 31, healthIndex: 65.4, totalSkus: 1010,
      annotation: {
        type: 'spike',
        title: 'Gemini Multimodal OCR Upgrade',
        cause: 'Activated high-precision table extraction for dense mechanical pinout diagrams and electrical rating matrices.',
        impact: '+1.7% confidence boost; automatically validated 45 previously flagged ambiguous pinouts.',
        badge: 'Major Spike (+1.7%)',
        sourceType: 'OCR Model Upgrade'
      }
    },
    { 
      date: 'Jul 27', day: 5, confidence: 67.8, confidenceDelta: +1.3, autoCommitRate: 55.0, resolvedConflicts: 28, healthIndex: 67.0, totalSkus: 1060 
    },
    { 
      date: 'Jul 28', day: 6, confidence: 69.2, confidenceDelta: +1.4, autoCommitRate: 57.5, resolvedConflicts: 34, healthIndex: 68.8, totalSkus: 1120,
      annotation: {
        type: 'spike',
        title: 'Autonomous Deduplication Engine',
        cause: 'Deployed cross-vendor entity resolution, matching 34 duplicate SKUs across supplier listings.',
        impact: 'Catalog clarity increased by +1.4%; eliminated redundant attribute conflicts.',
        badge: 'Resolution Spike (+1.4%)',
        sourceType: 'Deduplication'
      }
    },
    { 
      date: 'Jul 29', day: 7, confidence: 70.0, confidenceDelta: +0.8, autoCommitRate: 58.4, resolvedConflicts: 42, healthIndex: 70.2, totalSkus: 1180,
      annotation: {
        type: 'milestone',
        title: '70% Quality Threshold Surpassed',
        cause: 'Confidence reached 70.0% benchmark across all primary pressure & proximity sensors.',
        impact: 'First 1,000 canonical product records fully synchronized with enterprise ERP.',
        badge: 'Quality Milestone (70%)',
        sourceType: 'ERP Sync'
      }
    },
    { 
      date: 'Jul 30', day: 8, confidence: 69.6, confidenceDelta: -0.4, autoCommitRate: 60.1, resolvedConflicts: 39, healthIndex: 70.0, totalSkus: 1210,
      annotation: {
        type: 'dip',
        title: 'Metric vs Imperial Unit Friction',
        cause: 'Supplier CSV batch contained mixed PSI and Bar pressure ratings without explicit schema tags.',
        impact: 'Flagged 39 unit mismatch anomalies, reducing net certainty by 0.4%.',
        badge: 'Unit Dip (-0.4%)',
        sourceType: 'Supplier CSV'
      }
    },
    { 
      date: 'Jul 31', day: 9, confidence: 71.4, confidenceDelta: +1.8, autoCommitRate: 62.0, resolvedConflicts: 45, healthIndex: 72.1, totalSkus: 1280,
      annotation: {
        type: 'spike',
        title: 'Direct OEM Vector Datasheet Integration',
        cause: 'Connected direct API webhook to Siemens and Omron digital vector specification repositories.',
        impact: '+1.8% single-day confidence surge with 99.8% bounding-box verification accuracy.',
        badge: 'Major Surge (+1.8%)',
        sourceType: 'OEM API'
      }
    },
    { 
      date: 'Aug 01', day: 10, confidence: 72.8, confidenceDelta: +1.4, autoCommitRate: 63.5, resolvedConflicts: 50, healthIndex: 73.6, totalSkus: 1350 
    },
    { 
      date: 'Aug 02', day: 11, confidence: 74.0, confidenceDelta: +1.2, autoCommitRate: 65.2, resolvedConflicts: 48, healthIndex: 75.0, totalSkus: 1420 
    },
    { 
      date: 'Aug 03', day: 12, confidence: 73.5, confidenceDelta: -0.5, autoCommitRate: 66.0, resolvedConflicts: 38, healthIndex: 74.8, totalSkus: 1450,
      annotation: {
        type: 'dip',
        title: 'Thermal Tolerance Rating Dispute',
        cause: 'Secondary distributor sheet reported operating temp as -20°C to 70°C vs OEM rating of -40°C to 85°C.',
        impact: 'Queued 38 records for engineering discrepancy review, lowering score by 0.5%.',
        badge: 'Conflict Dip (-0.5%)',
        sourceType: 'Datasheet Conflict'
      }
    },
    { 
      date: 'Aug 04', day: 13, confidence: 75.2, confidenceDelta: +1.7, autoCommitRate: 67.8, resolvedConflicts: 54, healthIndex: 76.5, totalSkus: 1530,
      annotation: {
        type: 'spike',
        title: 'ISO 9001 Compliance Reasoning Applied',
        cause: 'Updated Gemini extraction logic with hierarchy rules prioritizing official manufacturer certificates of conformance.',
        impact: 'Overrode 54 contested distributor specs, restoring and boosting confidence by +1.7%.',
        badge: 'Rule Boost (+1.7%)',
        sourceType: 'Rule Optimization'
      }
    },
    { 
      date: 'Aug 05', day: 14, confidence: 76.8, confidenceDelta: +1.6, autoCommitRate: 69.4, resolvedConflicts: 61, healthIndex: 78.2, totalSkus: 1610 
    },
    { 
      date: 'Aug 06', day: 15, confidence: 78.1, confidenceDelta: +1.3, autoCommitRate: 71.0, resolvedConflicts: 58, healthIndex: 79.5, totalSkus: 1680 
    },
    { 
      date: 'Aug 07', day: 16, confidence: 77.9, confidenceDelta: -0.2, autoCommitRate: 72.3, resolvedConflicts: 49, healthIndex: 79.3, totalSkus: 1720,
      annotation: {
        type: 'dip',
        title: 'CAD 2D Drawing Ambiguity',
        cause: 'Mechanical mounting CAD drawings with partial dimension line occlusions uploaded from supplier portal.',
        impact: 'Generated 49 spatial ambiguity alerts, pausing automated commit for mounting bracket specs.',
        badge: 'CAD Dip (-0.2%)',
        sourceType: 'CAD Ingestion'
      }
    },
    { 
      date: 'Aug 08', day: 17, confidence: 79.4, confidenceDelta: +1.5, autoCommitRate: 73.5, resolvedConflicts: 64, healthIndex: 81.0, totalSkus: 1790,
      annotation: {
        type: 'spike',
        title: 'Vector CAD Cross-Verification Engine',
        cause: 'Integrated automated SVG wireframe coordinate parsing to resolve occlusion ambiguities.',
        impact: 'Cleared 64 disputed dimensional specs; confidence surged +1.5% to near 80%.',
        badge: 'Spatial Spike (+1.5%)',
        sourceType: 'CAD Engine'
      }
    },
    { 
      date: 'Aug 09', day: 18, confidence: 80.5, confidenceDelta: +1.1, autoCommitRate: 75.0, resolvedConflicts: 70, healthIndex: 82.4, totalSkus: 1860,
      annotation: {
        type: 'milestone',
        title: '80% Confidence Milestone Achieved',
        cause: 'Over 1,850 SKUs attained continuous 4-way provenance verification across manufacturer sheets.',
        impact: 'Auto-commit rate unlocked for standard electrical rating attributes.',
        badge: 'Milestone (80.5%)',
        sourceType: 'Quality Gate'
      }
    },
    { 
      date: 'Aug 10', day: 19, confidence: 81.9, confidenceDelta: +1.4, autoCommitRate: 76.2, resolvedConflicts: 73, healthIndex: 83.8, totalSkus: 1940 
    },
    { 
      date: 'Aug 11', day: 20, confidence: 82.4, confidenceDelta: +0.5, autoCommitRate: 77.5, resolvedConflicts: 68, healthIndex: 84.5, totalSkus: 1980 
    },
    { 
      date: 'Aug 12', day: 21, confidence: 81.8, confidenceDelta: -0.6, autoCommitRate: 78.0, resolvedConflicts: 59, healthIndex: 84.0, totalSkus: 2020,
      annotation: {
        type: 'dip',
        title: 'Multi-Vendor Ingress Collision',
        cause: 'Simultaneous ingestion of 3 conflicting distributor feeds with divergent thread pitch standards (NPT vs BSPT).',
        impact: '59 thread rating discrepancies triggered review queue triage; confidence dropped 0.6%.',
        badge: 'Ingress Dip (-0.6%)',
        sourceType: 'Distributor Collision'
      }
    },
    { 
      date: 'Aug 13', day: 22, confidence: 83.5, confidenceDelta: +1.7, autoCommitRate: 79.2, resolvedConflicts: 76, healthIndex: 85.9, totalSkus: 2100,
      annotation: {
        type: 'spike',
        title: 'Gemini Multimodal Attribution Boost',
        cause: 'AI model automatically mapped thread pitch citations to page-level engineering diagrams.',
        impact: 'Resolved 76 thread discrepancies autonomously, driving a +1.7% confidence recovery.',
        badge: 'Recovery Spike (+1.7%)',
        sourceType: 'Multimodal AI'
      }
    },
    { 
      date: 'Aug 14', day: 23, confidence: 84.7, confidenceDelta: +1.2, autoCommitRate: 80.5, resolvedConflicts: 82, healthIndex: 87.2, totalSkus: 2180 
    },
    { 
      date: 'Aug 15', day: 24, confidence: 85.9, confidenceDelta: +1.2, autoCommitRate: 81.8, resolvedConflicts: 88, healthIndex: 88.5, totalSkus: 2260,
      annotation: {
        type: 'milestone',
        title: 'Target 85% Auto-Commit Threshold Passed',
        cause: 'Exceeded target quality SLA (85.0%) across all industrial automation families.',
        impact: '81.8% of daily catalog changes now committed with zero manual human touch.',
        badge: 'Target Surpassed (85.9%)',
        sourceType: 'SLA Goal'
      }
    },
    { 
      date: 'Aug 16', day: 25, confidence: 86.4, confidenceDelta: +0.5, autoCommitRate: 82.4, resolvedConflicts: 79, healthIndex: 89.0, totalSkus: 2310 
    },
    { 
      date: 'Aug 17', day: 26, confidence: 87.8, confidenceDelta: +1.4, autoCommitRate: 83.6, resolvedConflicts: 94, healthIndex: 90.3, totalSkus: 2390,
      annotation: {
        type: 'spike',
        title: 'Bulk Automated Conflict Clearance',
        cause: 'Batch resolution of 94 historical supplier discrepancies using verified manufacturer certificates.',
        impact: '+1.4% confidence jump; health index broke above 90.0 for the first time.',
        badge: 'Clearance Spike (+1.4%)',
        sourceType: 'Batch Resolver'
      }
    },
    { 
      date: 'Aug 18', day: 27, confidence: 88.6, confidenceDelta: +0.8, autoCommitRate: 84.5, resolvedConflicts: 97, healthIndex: 91.1, totalSkus: 2450 
    },
    { 
      date: 'Aug 19', day: 28, confidence: 89.2, confidenceDelta: +0.6, autoCommitRate: 85.2, resolvedConflicts: 92, healthIndex: 91.8, totalSkus: 2510 
    },
    { 
      date: 'Aug 20', day: 29, confidence: 90.1, confidenceDelta: +0.9, autoCommitRate: 86.0, resolvedConflicts: 104, healthIndex: 92.5, totalSkus: 2580,
      annotation: {
        type: 'milestone',
        title: '90% Peak Quality Tier Achieved',
        cause: 'High-confidence provenance anchors established across 2,580 SKU catalog records.',
        impact: 'Human review queue backlog reduced by 78% compared to Day 1.',
        badge: 'Tier 1 Quality (90.1%)',
        sourceType: 'Milestone'
      }
    },
    { 
      date: 'Aug 21', day: 30, confidence: 91.4, confidenceDelta: +1.3, autoCommitRate: 87.2, resolvedConflicts: 110, healthIndex: 93.8, totalSkus: 2640,
      annotation: {
        type: 'spike',
        title: 'Global Ingestion Calibration',
        cause: 'Final reconciliation of multi-source feeds with 100% verified citation bounding boxes.',
        impact: 'All-time high confidence of 91.4% (+27.2% 30-day net gain) and 93.8/100 health index.',
        badge: 'Record High (+1.3%)',
        sourceType: 'Live State'
      }
    },
  ];
  return data;
};
