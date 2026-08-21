import React, { useState, useEffect, useRef } from 'react';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import { TopNav } from './components/TopNav';
import { LeftRail } from './components/LeftRail';
import { DashboardView } from './components/DashboardView';
import { FieldInspectorView } from './components/FieldInspectorView';
import { ReviewQueueView } from './components/ReviewQueueView';
import { ProductsCatalogView } from './components/ProductsCatalogView';
import { IngestionSourcesView } from './components/IngestionSourcesView';
import { SettingsView } from './components/SettingsView';
import { IngestModal } from './components/IngestModal';
import { INITIAL_PRODUCTS, INITIAL_SOURCES, CATEGORY_OVERVIEWS } from './data/mockData';
import { ProductRecord, IngestionSource, CategoryOverview, ActiveTab, FieldAuditEntry } from './types';

export default function App() {
  const [products, setProducts] = useState<ProductRecord[]>(INITIAL_PRODUCTS);
  const [sources, setSources] = useState<IngestionSource[]>(INITIAL_SOURCES);
  const [categories, setCategories] = useState<CategoryOverview[]>(CATEGORY_OVERVIEWS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord>(INITIAL_PRODUCTS[0]);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mainScrollRef = useRef<HTMLElement | null>(null);

  // Scroll to top when changing views
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Handle single product approval
  const handleApproveProduct = (productId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const approvalEntry: FieldAuditEntry = {
          id: `audit-batch-${Date.now()}`,
          timestamp: 'Just now',
          fieldId: 'f-all-approved',
          fieldName: 'All Attributes Verification',
          previousValue: `${p.fieldsReviewedCount}/${p.fieldsCount} Reviewed`,
          newValue: 'All Attributes Approved & Committed',
          changedBy: 'Balu R. (Lead Catalog Engineer)',
          changeType: 'verified_approval',
          confidenceBefore: p.confidence,
          confidenceAfter: 99,
          reason: 'Manual batch verification and approval of all extracted datasheet entities.',
          sourceRef: p.sourceDocument
        };

        const updatedProd: ProductRecord = {
          ...p,
          status: 'human_corrected',
          confidence: Math.max(95, p.confidence),
          confidenceLevel: 'high',
          fieldsReviewedCount: p.fieldsCount,
          conflictsSummary: undefined,
          fields: p.fields.map(f => ({ ...f, isApproved: true, confidence: Math.max(95, f.confidence) })),
          auditLog: [approvalEntry, ...(p.auditLog || [])]
        };

        if (selectedProduct.id === productId) {
          setSelectedProduct(updatedProd);
        }

        return updatedProd;
      }
      return p;
    }));
  };

  // Handle bulk product approval
  const handleApproveAll = (productIds: string[]) => {
    setProducts(prev => prev.map(p => {
      if (productIds.includes(p.id)) {
        const approvalEntry: FieldAuditEntry = {
          id: `audit-bulk-${Date.now()}-${p.id}`,
          timestamp: 'Just now',
          fieldId: 'f-all-approved',
          fieldName: 'All Attributes Verification',
          previousValue: `${p.fieldsReviewedCount}/${p.fieldsCount} Reviewed`,
          newValue: 'All Attributes Approved & Committed',
          changedBy: 'Balu R. (Lead Catalog Engineer)',
          changeType: 'verified_approval',
          confidenceBefore: p.confidence,
          confidenceAfter: 99,
          reason: 'Bulk queue review approval.',
          sourceRef: p.sourceDocument
        };

        const updatedProd: ProductRecord = {
          ...p,
          status: 'human_corrected',
          confidence: Math.max(95, p.confidence),
          confidenceLevel: 'high',
          fieldsReviewedCount: p.fieldsCount,
          conflictsSummary: undefined,
          fields: p.fields.map(f => ({ ...f, isApproved: true, confidence: Math.max(95, f.confidence) })),
          auditLog: [approvalEntry, ...(p.auditLog || [])]
        };

        if (selectedProduct.id === p.id) {
          setSelectedProduct(updatedProd);
        }

        return updatedProd;
      }
      return p;
    }));
  };

  // Handle field update in Field Inspector
  const handleUpdateField = (productId: string, fieldId: string, newValue: string, isApproved: boolean) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const targetField = p.fields.find(f => f.id === fieldId);
        const prevValue = targetField?.value || '';
        const prevConfidence = targetField?.confidence || 75;
        const fieldName = targetField?.name || 'Specification Field';
        const isRevert = targetField?.originalValue === newValue && targetField.isCorrected;
        const isValueSame = prevValue === newValue;

        const updatedFields = p.fields.map(f => {
          if (f.id === fieldId) {
            return {
              ...f,
              value: newValue,
              originalValue: f.originalValue || f.value,
              isCorrected: !isValueSame || f.isCorrected,
              isApproved: isApproved,
              confidence: 99,
              confidenceLevel: 'high' as const
            };
          }
          return f;
        });

        const newConfidence = Math.round(
          updatedFields.reduce((acc, f) => acc + f.confidence, 0) / updatedFields.length
        );

        const newAuditEntry: FieldAuditEntry = {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: 'Just now',
          fieldId,
          fieldName,
          previousValue: prevValue,
          newValue,
          changedBy: 'Balu R. (Lead Catalog Engineer)',
          changeType: isRevert ? 'revert' : isValueSame ? 'verified_approval' : 'manual_override',
          confidenceBefore: prevConfidence,
          confidenceAfter: 99,
          reason: isValueSame 
            ? 'Verified canonical representation against OEM datasheet schema'
            : isRevert
            ? `Reverted field value back to "${newValue}"`
            : `Manual override of attribute value to "${newValue}"`,
          sourceRef: p.sourceDocument
        };

        const existingAuditLog = p.auditLog || [];

        const updatedProd: ProductRecord = {
          ...p,
          fields: updatedFields,
          confidence: newConfidence,
          confidenceLevel: newConfidence >= 85 ? 'high' : 'medium',
          status: updatedFields.every(f => f.isApproved) ? 'human_corrected' : p.status,
          fieldsReviewedCount: updatedFields.filter(f => f.isApproved || f.isCorrected).length,
          auditLog: [newAuditEntry, ...existingAuditLog]
        };

        if (selectedProduct.id === productId) {
          setSelectedProduct(updatedProd);
        }

        return updatedProd;
      }
      return p;
    }));
  };

  // Handle approving all fields for currently inspected product
  const handleApproveAllFields = (productId: string) => {
    handleApproveProduct(productId);
    setSelectedProduct(prev => ({
      ...prev,
      status: 'human_corrected',
      confidence: 98,
      confidenceLevel: 'high',
      fieldsReviewedCount: prev.fieldsCount,
      conflictsSummary: undefined,
      fields: prev.fields.map(f => ({ ...f, isApproved: true, confidence: 99 }))
    }));
  };

  // Handle newly ingested source
  const handleIngestSuccess = (newProduct: ProductRecord, newSource: IngestionSource) => {
    setProducts(prev => [newProduct, ...prev]);
    setSources(prev => [newSource, ...prev]);
    setSelectedProduct(newProduct);
    setActiveTab('field_inspector');
  };

  const reviewQueueCount = products.filter(p => p.status === 'needs_review' || p.status === 'flagged_conflict').length;

  return (
    <div className="relative h-screen w-full bg-[#F5E9D8] text-[#191715] flex flex-col font-sans selection:bg-[#E8622C] selection:text-white overflow-hidden">
      {/* Background Organic Blobs (Matching Reference Style) */}
      <BackgroundBlobs />

      {/* Top Bar Navigation (Fixed & Stationary) */}
      <TopNav
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
        onSelectProduct={(p) => setSelectedProduct(p)}
        products={products}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Layout: Left Icon Rail (Stationary) + Content Area (Scrollable cards) */}
      <div className="relative z-10 flex flex-1 overflow-hidden min-h-0 w-full">
        <LeftRail
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          reviewQueueCount={reviewQueueCount}
        />

        <main
          id="main-content-scroll"
          ref={mainScrollRef}
          className="flex-1 h-full overflow-y-auto overflow-x-hidden min-h-0 w-full focus:outline-hidden"
        >
          <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
            {activeTab === 'dashboard' && (
              <DashboardView
                products={products}
                sources={sources}
                categories={categories}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onApproveProduct={handleApproveProduct}
                onOpenIngestModal={() => setIsIngestModalOpen(true)}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'field_inspector' && (
              <FieldInspectorView
                product={selectedProduct}
                products={products}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onUpdateField={handleUpdateField}
                onApproveAllFields={handleApproveAllFields}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'review_queue' && (
              <ReviewQueueView
                products={products}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onApproveProduct={handleApproveProduct}
                onApproveAll={handleApproveAll}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'catalog' && (
              <ProductsCatalogView
                products={products}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'sources' && (
              <IngestionSourcesView
                sources={sources}
                onOpenIngestModal={() => setIsIngestModalOpen(true)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView />
            )}
          </div>
        </main>
      </div>

      {/* Modal for Ingesting New Datasheets / CSVs */}
      <IngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestSuccess={handleIngestSuccess}
      />
    </div>
  );
}
