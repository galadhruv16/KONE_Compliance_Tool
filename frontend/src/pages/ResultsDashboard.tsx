import React, { useState } from 'react';

export interface ParameterItem {
  canonicalKey: string;
  displayName: string;
  category: string;
  tdsValue: string;
  tdsSource: string;
  ktocValue: string;
  ktocSource: string;
  status: 'MATCH' | 'MISMATCH' | 'REVIEW_REQUIRED' | 'MISSING_IN_TDS' | 'MISSING_IN_KTOC';
  mappingSource: string;
  reviewReason?: string;
}

export interface ElevatorReportData {
  tdsId: string;
  ktocId: string;
  parameters: ParameterItem[];
}

export interface ComplianceSummary {
  totalElevators: number;
  totalParameters: number;
  matches: number;
  mismatches: number;
  reviewRequired: number;
  tdsDate: string;
  ktocDate: string;
}

export const ResultsDashboard: React.FC<{
  summary: ComplianceSummary;
  elevators: ElevatorReportData[];
  onNewComparison: () => void;
}> = ({ summary, elevators, onNewComparison }) => {
  const [selectedElevatorIdx, setSelectedElevatorIdx] = useState(0);
  const [filterMode, setFilterMode] = useState<'ALL' | 'MATCH' | 'REVIEW'>('ALL');

  const currentElevator = elevators[selectedElevatorIdx] || elevators[0];

  // Helper to determine elevator status
  const getElevatorOverallStatus = (el: ElevatorReportData) => {
    const hasMismatch = el.parameters.some((p) => p.status === 'MISMATCH');
    if (hasMismatch) return 'MISMATCH';
    const hasReview = el.parameters.some((p) => p.status === 'REVIEW_REQUIRED');
    if (hasReview) return 'REVIEW_REQUIRED';
    return 'MATCH';
  };

  const filteredElevatorIndices = elevators
    .map((el, idx) => ({ el, idx }))
    .filter(({ el }) => {
      const status = getElevatorOverallStatus(el);
      if (filterMode === 'MATCH') return status === 'MATCH';
      if (filterMode === 'REVIEW') return status === 'REVIEW_REQUIRED' || status === 'MISMATCH';
      return true;
    });

  // Categorize parameters for human-friendly viewing
  const categorizeParameters = (params: ParameterItem[]) => {
    const categories: Record<string, ParameterItem[]> = {
      'Capacity & Performance': [],
      'Cabin Dimensions': [],
      'Shaft & Clearances': [],
      'Doors & Entrances': [],
      'General Specifications': [],
    };

    params.forEach((p) => {
      const key = p.canonicalKey.toLowerCase();
      const cat = p.category.toLowerCase();

      if (key.includes('capacity') || key.includes('speed') || key.includes('load') || key.includes('stops') || key.includes('travel') || cat.includes('performance') || cat.includes('capacity')) {
        categories['Capacity & Performance'].push(p);
      } else if (key.includes('car_') || key.includes('cabin') || key.includes('ceiling') || cat.includes('dimension') || cat.includes('car')) {
        categories['Cabin Dimensions'].push(p);
      } else if (key.includes('shaft') || key.includes('pit') || key.includes('overhead') || cat.includes('shaft')) {
        categories['Shaft & Clearances'].push(p);
      } else if (key.includes('door') || key.includes('entrance') || key.includes('landing') || cat.includes('door')) {
        categories['Doors & Entrances'].push(p);
      } else {
        categories['General Specifications'].push(p);
      }
    });

    return categories;
  };

  const grouped = currentElevator ? categorizeParameters(currentElevator.parameters) : {};

  const renderStatusBadge = (status: ParameterItem['status']) => {
    switch (status) {
      case 'MATCH':
        return <span style={styles.badgeMatch}>Match</span>;
      case 'REVIEW_REQUIRED':
        return <span style={styles.badgeReview}>Needs Review</span>;
      case 'MISMATCH':
        return <span style={styles.badgeMismatch}>Difference</span>;
      default:
        return <span style={styles.badgeNeutral}>{status}</span>;
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brandRow}>
            <img src="/assets/kone-logo.png" alt="KONE" style={styles.logo} />
            <div style={styles.divider} />
            <div>
              <span style={styles.appTitle}>Specification Verification Results</span>
              <span style={styles.appSubtitle}>TDS vs KTOC Compliance Comparison</span>
            </div>
          </div>

          <div style={styles.actionRow}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => window.print()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Save as PDF</span>
            </button>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={onNewComparison}
            >
              <span>Check Another Project</span>
            </button>
          </div>
        </div>
      </header>

      {/* Summary KPI Ribbon */}
      <div style={styles.kpiRibbon}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Elevators</span>
          <span style={styles.kpiValue}>{summary.totalElevators} Units</span>
        </div>
        <div style={{ ...styles.kpiCard, borderLeft: '3px solid #059669' }}>
          <span style={styles.kpiLabel}>Fully Matching</span>
          <span style={{ ...styles.kpiValue, color: '#059669' }}>{summary.matches} Parameters</span>
        </div>
        <div style={{ ...styles.kpiCard, borderLeft: '3px solid #D97706' }}>
          <span style={styles.kpiLabel}>Review Required</span>
          <span style={{ ...styles.kpiValue, color: '#D97706' }}>{summary.reviewRequired} Notes</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Overall Assessment</span>
          <span style={styles.kpiStatusPill}>
            {summary.mismatches === 0 ? 'Compliant with Notes' : 'Discrepancies Detected'}
          </span>
        </div>
      </div>

      {/* Master-Detail Split Workspace */}
      <div style={styles.workspace}>
        {/* Left Rail: Elevator Selector */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>Select Elevator</span>
            {/* Filter pills */}
            <div style={styles.filterPillGroup}>
              <button
                type="button"
                style={{
                  ...styles.filterPill,
                  backgroundColor: filterMode === 'ALL' ? '#0055D4' : '#FFFFFF',
                  color: filterMode === 'ALL' ? '#FFFFFF' : '#64748B',
                }}
                onClick={() => setFilterMode('ALL')}
              >
                All ({elevators.length})
              </button>
              <button
                type="button"
                style={{
                  ...styles.filterPill,
                  backgroundColor: filterMode === 'MATCH' ? '#059669' : '#FFFFFF',
                  color: filterMode === 'MATCH' ? '#FFFFFF' : '#64748B',
                }}
                onClick={() => setFilterMode('MATCH')}
              >
                Pass
              </button>
              <button
                type="button"
                style={{
                  ...styles.filterPill,
                  backgroundColor: filterMode === 'REVIEW' ? '#D97706' : '#FFFFFF',
                  color: filterMode === 'REVIEW' ? '#FFFFFF' : '#64748B',
                }}
                onClick={() => setFilterMode('REVIEW')}
              >
                Review
              </button>
            </div>
          </div>

          <div style={styles.elevatorList}>
            {filteredElevatorIndices.map(({ el, idx }) => {
              const isSelected = selectedElevatorIdx === idx;
              const status = getElevatorOverallStatus(el);

              return (
                <div
                  key={idx}
                  style={{
                    ...styles.elevatorCard,
                    backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                    borderColor: isSelected ? '#0055D4' : '#E2E8F0',
                  }}
                  onClick={() => setSelectedElevatorIdx(idx)}
                >
                  <div style={styles.elevatorCardTop}>
                    <span style={styles.elevatorCardName}>{el.tdsId}</span>
                    {status === 'MATCH' && (
                      <span style={styles.cardPassBadge}>Match</span>
                    )}
                    {status === 'REVIEW_REQUIRED' && (
                      <span style={styles.cardReviewBadge}>Review</span>
                    )}
                    {status === 'MISMATCH' && (
                      <span style={styles.cardDiffBadge}>Diff</span>
                    )}
                  </div>
                  <div style={styles.elevatorCardSub}>
                    KTOC Order: {el.ktocId}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Canvas: Categorized Parameter Inspection */}
        <main style={styles.mainCanvas}>
          {currentElevator ? (
            <div>
              {/* Unit Header */}
              <div style={styles.canvasHeader}>
                <div>
                  <h2 style={styles.canvasTitle}>{currentElevator.tdsId}</h2>
                  <p style={styles.canvasSub}>
                    Cross-referenced against KTOC Order Form: <strong>{currentElevator.ktocId}</strong>
                  </p>
                </div>
                <div style={styles.paramCountBadge}>
                  {currentElevator.parameters.length} Parameters Checked
                </div>
              </div>

              {/* Categorized Sections */}
              {Object.entries(grouped).map(([categoryName, items]) => {
                if (items.length === 0) return null;

                return (
                  <div key={categoryName} style={styles.categoryCard}>
                    <h3 style={styles.categoryTitle}>{categoryName}</h3>

                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr style={styles.tableHeadRow}>
                            <th style={styles.th}>Parameter</th>
                            <th style={styles.th}>Customer Requirement (TDS)</th>
                            <th style={styles.th}>KTOC Order Form</th>
                            <th style={{ ...styles.th, textAlign: 'right' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((param, pIdx) => (
                            <React.Fragment key={pIdx}>
                              <tr style={styles.tableRow}>
                                <td style={styles.tdParamName}>
                                  {param.displayName}
                                </td>
                                <td style={styles.tdValue}>
                                  {param.tdsValue}
                                </td>
                                <td style={styles.tdValue}>
                                  {param.ktocValue}
                                </td>
                                <td style={{ ...styles.tdValue, textAlign: 'right' }}>
                                  {renderStatusBadge(param.status)}
                                </td>
                              </tr>
                              {/* Plain English explanation callout if review is needed */}
                              {param.reviewReason && (
                                <tr>
                                  <td colSpan={4} style={styles.reviewNoteCell}>
                                    <div style={styles.reviewNoteBox}>
                                      <span style={styles.reviewNoteIcon}>ℹ️</span>
                                      <span>{param.reviewReason}</span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptyPrompt}>Select an elevator to view specifications.</div>
          )}
        </main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  header: {
    height: '64px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    flexShrink: 0,
    zIndex: 10,
  },
  headerInner: {
    height: '100%',
    padding: '0 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    height: '32px',
    width: 'auto',
    display: 'block',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#E2E8F0',
  },
  appTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    display: 'block',
    lineHeight: '1.2',
  },
  appSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    display: 'block',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: '#334155',
    fontSize: '13px',
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  primaryBtn: {
    backgroundColor: '#0055D4',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    padding: '8px 18px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  kpiRibbon: {
    height: '62px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 28px',
    gap: '24px',
    flexShrink: 0,
  },
  kpiCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 12px',
  },
  kpiLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: 500,
  },
  kpiValue: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A',
  },
  kpiStatusPill: {
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#ECFDF5',
    color: '#059669',
    border: '1px solid #D1FAE5',
    padding: '3px 10px',
    borderRadius: '12px',
  },
  workspace: {
    flex: 1,
    display: 'flex',
    height: 'calc(100vh - 64px - 62px)',
    overflow: 'hidden',
  },
  sidebar: {
    width: '300px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sidebarTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  filterPillGroup: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    padding: '3px',
    borderRadius: '8px',
    gap: '4px',
  },
  filterPill: {
    flex: 1,
    fontSize: '11px',
    fontWeight: 600,
    padding: '5px 0',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s ease',
  },
  elevatorList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  elevatorCard: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    transition: 'all 0.15s ease',
  },
  elevatorCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  elevatorCardName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
  },
  elevatorCardSub: {
    fontSize: '12px',
    color: '#64748B',
  },
  cardPassBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  cardReviewBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  cardDiffBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  mainCanvas: {
    flex: 1,
    padding: '28px 36px',
    overflowY: 'auto',
  },
  canvasHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  canvasTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 4px 0',
  },
  canvasSub: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
  },
  paramCountBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#0055D4',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    padding: '5px 12px',
    borderRadius: '8px',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  categoryTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 14px 0',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  tableHeadRow: {
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tableRow: {
    borderBottom: '1px solid #F1F5F9',
  },
  tdParamName: {
    padding: '12px',
    fontWeight: 600,
    color: '#1E293B',
    width: '28%',
  },
  tdValue: {
    padding: '12px',
    color: '#334155',
  },
  badgeMatch: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    padding: '3px 8px',
    borderRadius: '6px',
    display: 'inline-block',
  },
  badgeReview: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    padding: '3px 8px',
    borderRadius: '6px',
    display: 'inline-block',
  },
  badgeMismatch: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    padding: '3px 8px',
    borderRadius: '6px',
    display: 'inline-block',
  },
  badgeNeutral: {
    fontSize: '11px',
    color: '#64748B',
  },
  reviewNoteCell: {
    padding: '4px 12px 12px 12px',
  },
  reviewNoteBox: {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#92400E',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  reviewNoteIcon: {
    fontSize: '14px',
    flexShrink: 0,
  },
  emptyPrompt: {
    textAlign: 'center',
    padding: '40px',
    color: '#94A3B8',
    fontSize: '14px',
  },
};
