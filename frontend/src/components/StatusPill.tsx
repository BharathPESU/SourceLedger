import React from 'react';
import { ConfidenceLevel, RecordStatus, IngestionStatus } from '../types';

interface StatusPillProps {
  type?: 'confidence' | 'status' | 'ingestion' | 'category' | 'custom';
  confidenceLevel?: ConfidenceLevel;
  confidenceScore?: number;
  status?: RecordStatus;
  ingestionStatus?: IngestionStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  type = 'confidence',
  confidenceLevel,
  confidenceScore,
  status,
  ingestionStatus,
  label,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
    md: 'px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
    lg: 'px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider'
  };

  // Confidence Level Badges
  if (type === 'confidence' || confidenceLevel !== undefined) {
    const level = confidenceLevel || (confidenceScore ? (confidenceScore >= 85 ? 'high' : confidenceScore >= 65 ? 'medium' : 'low') : 'medium');
    
    if (level === 'high') {
      return (
        <span
          className={`inline-flex items-center justify-center rounded-full bg-[#E8622C]/90 backdrop-blur-md text-white border border-white/30 shadow-xs ${sizeClasses[size]} ${className}`}
        >
          {label || 'High'}
        </span>
      );
    }

    if (level === 'medium') {
      return (
        <span
          className={`inline-flex items-center justify-center rounded-full bg-[#1A1A1A]/85 backdrop-blur-md text-white border border-white/20 shadow-xs ${sizeClasses[size]} ${className}`}
        >
          {label || 'Medium'}
        </span>
      );
    }

    // Low confidence / needs attention
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-white/60 backdrop-blur-md text-[#1A1A1A] border border-white/70 shadow-2xs ${sizeClasses[size]} ${className}`}
      >
        {label || 'Low'}
      </span>
    );
  }

  // Record Status Badges
  if (type === 'status' && status) {
    switch (status) {
      case 'auto_committed':
        return (
          <span className={`inline-flex items-center justify-center rounded-full bg-[#EAF5EE]/80 backdrop-blur-md text-[#1F8A53] border border-[#1F8A53]/20 shadow-2xs ${sizeClasses[size]} ${className}`}>
            Auto-Committed
          </span>
        );
      case 'needs_review':
        return (
          <span className={`inline-flex items-center justify-center rounded-full bg-[#E8622C]/90 backdrop-blur-md text-white border border-white/30 shadow-xs ${sizeClasses[size]} ${className}`}>
            Needs Review
          </span>
        );
      case 'human_corrected':
        return (
          <span className={`inline-flex items-center justify-center rounded-full bg-[#1A1A1A]/85 backdrop-blur-md text-white border border-white/20 shadow-xs ${sizeClasses[size]} ${className}`}>
            Verified
          </span>
        );
      case 'flagged_conflict':
        return (
          <span className={`inline-flex items-center justify-center rounded-full bg-[#FEF2F2]/85 backdrop-blur-md text-[#C53030] border border-[#FECACA] shadow-2xs ${sizeClasses[size]} ${className}`}>
            Conflict
          </span>
        );
    }
  }

  // Ingestion status badges
  if (type === 'ingestion' && ingestionStatus) {
    switch (ingestionStatus) {
      case 'completed':
        return (
          <span className={`inline-flex items-center justify-center rounded-full bg-[#EAF5EE]/80 backdrop-blur-md text-[#1F8A53] border border-[#1F8A53]/20 shadow-2xs ${sizeClasses[size]} ${className}`}>
            Completed
          </span>
        );
      case 'processing':
        return (
          <span className={`inline-flex items-center justify-center rounded-full bg-[#E8622C]/90 backdrop-blur-md text-white border border-white/30 shadow-xs ${sizeClasses[size]} ${className}`}>
            Extracting
          </span>
        );
      case 'queued':
        return (
          <span className={`inline-flex items-center justify-center rounded-full bg-white/60 backdrop-blur-md text-[#1A1A1A] border border-white/70 shadow-2xs ${sizeClasses[size]} ${className}`}>
            Queued
          </span>
        );
      case 'failed':
        return (
          <span className={`inline-flex items-center justify-center rounded-full bg-[#FEF2F2]/85 backdrop-blur-md text-[#C53030] border border-[#FECACA] shadow-2xs ${sizeClasses[size]} ${className}`}>
            Failed
          </span>
        );
    }
  }

  // Default pill
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-white/60 backdrop-blur-md text-[#1A1A1A] border border-white/70 shadow-2xs ${sizeClasses[size]} ${className}`}>
      {label}
    </span>
  );
};

