import React from 'react';

export interface ProgressStep {
  label: string;
  detail: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
}

export const ProcessingModal: React.FC<{
  isOpen: boolean;
  steps: ProgressStep[];
  currentStepIndex: number;
  tdsName: string;
  ktocName: string;
}> = ({ isOpen, steps, currentStepIndex, tdsName, ktocName }) => {
  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round(((currentStepIndex + 0.5) / steps.length) * 100));

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        {/* Header */}
        <div style={styles.header}>
          <img src="/assets/kone-logo.png" alt="KONE" style={styles.logo} />
          <h2 style={styles.title}>Comparing Elevator Specifications</h2>
          <p style={styles.subtitle}>
            Checking {tdsName || 'Customer TDS'} against {ktocName || 'KTOC Order Form'}...
          </p>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressBarWrapper}>
          <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }} />
        </div>

        {/* Friendly Steps List */}
        <div style={styles.stepsContainer}>
          {steps.map((step, idx) => {
            const isCompleted = step.status === 'COMPLETED';
            const isActive = step.status === 'ACTIVE';

            return (
              <div key={idx} style={styles.stepRow}>
                <div
                  style={{
                    ...styles.stepIndicator,
                    backgroundColor: isCompleted ? '#059669' : isActive ? '#0055D4' : '#F1F5F9',
                    color: isCompleted || isActive ? '#FFFFFF' : '#94A3B8',
                    border: isCompleted || isActive ? 'none' : '1px solid #E2E8F0',
                  }}
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div style={styles.stepInfo}>
                  <div style={styles.stepLabelRow}>
                    <span
                      style={{
                        ...styles.stepLabel,
                        color: isActive ? '#0055D4' : isCompleted ? '#0F172A' : '#64748B',
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      {step.label}
                    </span>
                    {isActive && <span style={styles.activeBadge}>In Progress</span>}
                  </div>
                  <span style={styles.stepDetail}>{step.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.footerNote}>
          <span>Files are processed safely in local memory.</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '36px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logo: {
    height: '28px',
    width: 'auto',
    marginBottom: '14px',
  },
  title: {
    fontSize: '19px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    lineHeight: '1.4',
    margin: 0,
  },
  progressBarWrapper: {
    width: '100%',
    height: '6px',
    backgroundColor: '#F1F5F9',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '26px',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0055D4',
    transition: 'width 0.4s ease',
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },
  stepIndicator: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '2px',
  },
  stepInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  stepLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stepLabel: {
    fontSize: '14px',
  },
  activeBadge: {
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#EFF6FF',
    color: '#0055D4',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  stepDetail: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  footerNote: {
    borderTop: '1px solid #F1F5F9',
    paddingTop: '14px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#94A3B8',
  },
};
