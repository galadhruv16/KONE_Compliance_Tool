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
  const currentElevator = elevators[selectedElevatorIdx] || elevators[0];

  const getStatusBadge = (status: ParameterItem['status']) => {
    switch (status) {
      case 'MATCH':
        return <span style={styles.badgeMatch}>MATCH</span>;
      case 'MISMATCH':
        return <span style={styles.badgeMismatch}>MISMATCH</span>;
      case 'REVIEW_REQUIRED':
        return <span style={styles.badgeReview}>REVIEW REQUIRED</span>;
      default:
        return <span style={styles.badgeNeutral}>{status}</span>;
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.brandRow}>
            <img src="/assets/kone-logo.png" alt="KONE" style={styles.logo} />
            <div style={styles.divider} />
            <div style={styles.titleBlock}>
              <span style={styles.appTitle}>Compliance Verification Report</span>
              <span style={styles.metaBadge}>TDS: {summary.tdsDate} | KTOC: {summary.ktocDate}</span>
            </div>
          </div>
          <div style={styles.actionButtons}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => window.print()}
            >
              Export PDF
            </button>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={onNewComparison}
            >
              New Check
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* KPI Metric Summary Row */}
        <div style={styles.metricGrid}>
          <div style={styles.metricCard}>
            <span style={styles.metricLabel}>Verified Elevators</span>
            <span style={styles.metricValue}>{summary.totalElevators} Units</span>
          </div>
          <div style={styles.metricCard}>
            <span style={styles.metricLabel}>Total Parameters</span>
            <span style={styles.metricValue}>{summary.totalParameters} Specs</span>
          </div>
          <div style={{ ...styles.metricCard, borderLeft: '4px solid #10B981' }}>
            <span style={styles.metricLabel}>Compliant Matches</span>
            <span style={{ ...styles.metricValue, color: '#10B981' }}>{summary.matches}</span>
          </div>
          <div style={{ ...styles.metricCard, borderLeft: '4px solid #EF4444' }}>
            <span style={styles.metricLabel}>Discrepancies</span>
            <span style={{ ...styles.metricValue, color: '#EF4444' }}>{summary.mismatches}</span>
          </div>
          <div style={{ ...styles.metricCard, borderLeft: '4px solid #F59E0B' }}>
            <span style={styles.metricLabel}>Review Required</span>
            <span style={{ ...styles.metricValue, color: '#F59E0B' }}>{summary.reviewRequired}</span>
          </div>
        </div>

        {/* Elevator Segmented Tabs */}
        <div style={styles.tabsWrapper}>
          <div style={styles.tabsHeader}>Select Elevator Locus:</div>
          <div style={styles.tabList}>
            {elevators.map((el, idx) => (
              <button
                key={idx}
                type="button"
                style={{
                  ...styles.tabButton,
                  backgroundColor: selectedElevatorIdx === idx ? '#0055D4' : '#FFFFFF',
                  color: selectedElevatorIdx === idx ? '#FFFFFF' : '#0E1E38',
                  borderColor: selectedElevatorIdx === idx ? '#0055D4' : '#E2E8F0',
                }}
                onClick={() => setSelectedElevatorIdx(idx)}
              >
                <span>{el.tdsId}</span>
                <span style={styles.tabSub}>{el.ktocId}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Parameters Table */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeaderBar}>
            <h3 style={styles.tableTitle}>
              Specifications for {currentElevator?.tdsId} ↔ {currentElevator?.ktocId}
            </h3>
            <span style={styles.tableCount}>
              {currentElevator?.parameters.length || 0} Parameters
            </span>
          </div>

          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>Parameter</th>
                <th style={styles.th}>Customer TDS Requirement</th>
                <th style={styles.th}>KTOC Supply Line Order</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Provenance & Notes</th>
              </tr>
            </thead>
            <tbody>
              {currentElevator?.parameters.map((param, pIdx) => (
                <tr key={pIdx} style={styles.tableBodyRow}>
                  <td style={styles.tdParam}>
                    <div style={styles.paramName}>{param.displayName}</div>
                    <div style={styles.paramKey}>{param.canonicalKey}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.valText}>{param.tdsValue}</div>
                    <div style={styles.sourceText}>{param.tdsSource}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.valText}>{param.ktocValue}</div>
                    <div style={styles.sourceText}>{param.ktocSource}</div>
                  </td>
                  <td style={styles.td}>
                    {getStatusBadge(param.status)}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.provenanceTag}>{param.mappingSource}</div>
                    {param.reviewReason && (
                      <div style={styles.reviewReasonText}>{param.reviewReason}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <footer style={styles.footer}>
        <span>KONE Corporation · Global Supply Line Compliance · Internal Authorized Use Only</span>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FAFCFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#0E1E38',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '14px 32px',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
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
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#E2E8F0',
  },
  titleBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  appTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#0E1E38',
  },
  metaBadge: {
    fontSize: '12px',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  actionButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: '#0E1E38',
    padding: '7px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  primaryButton: {
    backgroundColor: '#0055D4',
    border: 'none',
    color: '#FFFFFF',
    padding: '7px 18px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748B',
  },
  metricValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#0E1E38',
  },
  tabsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tabsHeader: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748B',
  },
  tabList: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  tabButton: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    minWidth: '120px',
  },
  tabSub: {
    fontSize: '11px',
    opacity: 0.8,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  tableHeaderBar: {
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  tableTitle: {
    fontSize: '15px',
    fontWeight: 600,
    margin: 0,
    color: '#0E1E38',
  },
  tableCount: {
    fontSize: '12px',
    color: '#64748B',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeadRow: {
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  th: {
    padding: '12px 20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tableBodyRow: {
    borderBottom: '1px solid #F1F5F9',
  },
  tdParam: {
    padding: '14px 20px',
    width: '24%',
  },
  paramName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0E1E38',
  },
  paramKey: {
    fontSize: '11px',
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  td: {
    padding: '14px 20px',
    verticalAlign: 'top',
  },
  valText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0E1E38',
  },
  sourceText: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  badgeMatch: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '4px',
    display: 'inline-block',
  },
  badgeMismatch: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '4px',
    display: 'inline-block',
  },
  badgeReview: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '4px',
    display: 'inline-block',
  },
  badgeNeutral: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '4px',
    display: 'inline-block',
  },
  provenanceTag: {
    fontSize: '11px',
    color: '#0055D4',
    fontWeight: 500,
  },
  reviewReasonText: {
    fontSize: '11px',
    color: '#B45309',
    marginTop: '3px',
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: '12px',
    color: '#94A3B8',
  },
};
