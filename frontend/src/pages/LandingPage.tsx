import React, { useState, useRef } from 'react';

export interface FileState {
  file: File | null;
  name: string;
  size: string;
  isValid: boolean;
  error?: string;
}

export const LandingPage: React.FC<{
  onStartComparison: (tdsFile: File, ktocFile: File) => void;
}> = ({ onStartComparison }) => {
  const [tdsState, setTdsState] = useState<FileState>({ file: null, name: '', size: '', isValid: false });
  const [ktocState, setKtocState] = useState<FileState>({ file: null, name: '', size: '', isValid: false });
  const [isTdsDragging, setIsTdsDragging] = useState(false);
  const [isKtocDragging, setIsKtocDragging] = useState(false);

  const tdsInputRef = useRef<HTMLInputElement>(null);
  const ktocInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleTdsFile = (file: File | undefined) => {
    if (!file) return;
    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isXlsx) {
      setTdsState({
        file: null,
        name: file.name,
        size: formatFileSize(file.size),
        isValid: false,
        error: 'Please upload an Excel workbook (.xlsx or .xls)',
      });
      return;
    }
    setTdsState({
      file,
      name: file.name,
      size: formatFileSize(file.size),
      isValid: true,
      error: undefined,
    });
  };

  const handleKtocFile = (file: File | undefined) => {
    if (!file) return;
    const isPdf = file.name.endsWith('.pdf');
    if (!isPdf) {
      setKtocState({
        file: null,
        name: file.name,
        size: formatFileSize(file.size),
        isValid: false,
        error: 'Please upload a KTOC Order Form PDF (.pdf)',
      });
      return;
    }
    setKtocState({
      file,
      name: file.name,
      size: formatFileSize(file.size),
      isValid: true,
      error: undefined,
    });
  };

  const canSubmit = tdsState.isValid && ktocState.isValid && tdsState.file && ktocState.file;

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brandRow}>
            <img src="/assets/kone-logo.png" alt="KONE" style={styles.logo} />
            <div style={styles.divider} />
            <div>
              <span style={styles.appTitle}>Specification Compliance Studio</span>
              <span style={styles.appSubtitle}>Automated TDS ↔ KTOC Verification</span>
            </div>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.statusBadge}>Ready</span>
          </div>
        </div>
      </header>

      {/* Main Split Studio Workspace */}
      <main style={styles.workspace}>
        {/* Left Studio Bay: Customer TDS (Excel) */}
        <div
          style={{
            ...styles.bay,
            backgroundColor: isTdsDragging ? '#F0F6FF' : '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
          }}
          onDragOver={(e) => { e.preventDefault(); setIsTdsDragging(true); }}
          onDragLeave={() => setIsTdsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsTdsDragging(false);
            handleTdsFile(e.dataTransfer.files?.[0]);
          }}
        >
          <div style={styles.bayHeader}>
            <div style={styles.bayIconWrap}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0055D4" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="16" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <div style={styles.bayStep}>DOCUMENT 01</div>
              <h2 style={styles.bayTitle}>Customer Technical Data Sheet (TDS)</h2>
              <p style={styles.bayDesc}>Tender specifications with customer elevator parameters (.xlsx, .xls)</p>
            </div>
          </div>

          <div style={styles.bayBody}>
            {tdsState.isValid ? (
              <div style={styles.fileCard}>
                <div style={styles.fileCardIconWrap}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div style={styles.fileCardDetails}>
                  <span style={styles.fileCardName}>{tdsState.name}</span>
                  <span style={styles.fileCardMeta}>{tdsState.size} • Ready for analysis</span>
                </div>
                <button
                  type="button"
                  style={styles.replaceBtn}
                  onClick={() => tdsInputRef.current?.click()}
                >
                  Change
                </button>
              </div>
            ) : (
              <div
                style={{
                  ...styles.dropZone,
                  borderColor: isTdsDragging ? '#0055D4' : '#CBD5E1',
                }}
                onClick={() => tdsInputRef.current?.click()}
              >
                <div style={styles.dropZoneIcon}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p style={styles.dropZoneMainText}>
                  Drop customer Excel file here, or <span style={styles.dropZoneHighlight}>browse</span>
                </p>
                <span style={styles.dropZoneSubText}>Excel spreadsheets (.xlsx or .xls)</span>
              </div>
            )}
            {tdsState.error && <p style={styles.errorText}>{tdsState.error}</p>}
          </div>

          <input
            ref={tdsInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => handleTdsFile(e.target.files?.[0])}
          />
        </div>

        {/* Right Studio Bay: KONE KTOC (PDF) */}
        <div
          style={{
            ...styles.bay,
            backgroundColor: isKtocDragging ? '#F0F6FF' : '#F8FAFC',
          }}
          onDragOver={(e) => { e.preventDefault(); setIsKtocDragging(true); }}
          onDragLeave={() => setIsKtocDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsKtocDragging(false);
            handleKtocFile(e.dataTransfer.files?.[0]);
          }}
        >
          <div style={styles.bayHeader}>
            <div style={styles.bayIconWrap}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0055D4" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <div style={styles.bayStep}>DOCUMENT 02</div>
              <h2 style={styles.bayTitle}>KONE KTOC Order Form</h2>
              <p style={styles.bayDesc}>KONE supply line order form document with elevator specifications (.pdf)</p>
            </div>
          </div>

          <div style={styles.bayBody}>
            {ktocState.isValid ? (
              <div style={styles.fileCard}>
                <div style={styles.fileCardIconWrap}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div style={styles.fileCardDetails}>
                  <span style={styles.fileCardName}>{ktocState.name}</span>
                  <span style={styles.fileCardMeta}>{ktocState.size} • Ready for analysis</span>
                </div>
                <button
                  type="button"
                  style={styles.replaceBtn}
                  onClick={() => ktocInputRef.current?.click()}
                >
                  Change
                </button>
              </div>
            ) : (
              <div
                style={{
                  ...styles.dropZone,
                  borderColor: isKtocDragging ? '#0055D4' : '#CBD5E1',
                }}
                onClick={() => ktocInputRef.current?.click()}
              >
                <div style={styles.dropZoneIcon}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p style={styles.dropZoneMainText}>
                  Drop KTOC Order Form PDF here, or <span style={styles.dropZoneHighlight}>browse</span>
                </p>
                <span style={styles.dropZoneSubText}>KTOC Order Form document (.pdf)</span>
              </div>
            )}
            {ktocState.error && <p style={styles.errorText}>{ktocState.error}</p>}
          </div>

          <input
            ref={ktocInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleKtocFile(e.target.files?.[0])}
          />
        </div>
      </main>

      {/* Floating Bottom Control Dock */}
      <footer style={styles.bottomDock}>
        <div style={styles.bottomDockContent}>
          <div style={styles.dockStatus}>
            {canSubmit ? (
              <span style={styles.dockStatusSuccess}>
                <span style={styles.statusDotGreen} />
                Both documents staged — Ready to compare
              </span>
            ) : (
              <span style={styles.dockStatusPending}>
                <span style={styles.statusDotAmber} />
                Please upload both documents to start verification
              </span>
            )}
          </div>

          <button
            type="button"
            style={{
              ...styles.submitBtn,
              backgroundColor: canSubmit ? '#0055D4' : '#94A3B8',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.7,
            }}
            disabled={!canSubmit}
            onClick={() => {
              if (canSubmit && tdsState.file && ktocState.file) {
                onStartComparison(tdsState.file, ktocState.file);
              }
            }}
          >
            <span>Compare Specifications</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  header: {
    height: '64px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
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
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    border: '1px solid #D1FAE5',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  workspace: {
    flex: 1,
    display: 'flex',
    height: 'calc(100vh - 64px - 76px)',
    overflow: 'hidden',
  },
  bay: {
    flex: 1,
    padding: '36px 48px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    transition: 'background-color 0.2s ease',
  },
  bayHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '28px',
  },
  bayIconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bayStep: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#0055D4',
    letterSpacing: '0.06em',
    marginBottom: '4px',
  },
  bayTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 4px 0',
  },
  bayDesc: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
  },
  bayBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  dropZone: {
    flex: 1,
    minHeight: '260px',
    border: '2px dashed #CBD5E1',
    borderRadius: '14px',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: '32px',
    transition: 'all 0.2s ease',
  },
  dropZoneIcon: {
    marginBottom: '14px',
  },
  dropZoneMainText: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1E293B',
    margin: '0 0 6px 0',
  },
  dropZoneHighlight: {
    color: '#0055D4',
    fontWeight: 600,
    textDecoration: 'underline',
  },
  dropZoneSubText: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  fileCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '12px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  fileCardIconWrap: {
    flexShrink: 0,
  },
  fileCardDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
  },
  fileCardName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileCardMeta: {
    fontSize: '12px',
    color: '#64748B',
  },
  replaceBtn: {
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    color: '#334155',
    fontSize: '12px',
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  errorText: {
    color: '#DC2626',
    fontSize: '12px',
    marginTop: '10px',
  },
  bottomDock: {
    height: '76px',
    borderTop: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    padding: '0 36px',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.02)',
  },
  bottomDockContent: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dockStatus: {
    fontSize: '13px',
    fontWeight: 500,
  },
  dockStatusSuccess: {
    color: '#059669',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dockStatusPending: {
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDotGreen: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    display: 'inline-block',
  },
  statusDotAmber: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#F59E0B',
    display: 'inline-block',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    padding: '12px 28px',
    borderRadius: '8px',
    border: 'none',
    transition: 'background-color 0.2s ease',
  },
};
