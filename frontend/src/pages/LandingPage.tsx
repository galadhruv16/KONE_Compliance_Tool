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
        error: 'Please upload a valid KTOC Order Form PDF (.pdf)',
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

  const handleClear = () => {
    setTdsState({ file: null, name: '', size: '', isValid: false });
    setKtocState({ file: null, name: '', size: '', isValid: false });
    if (tdsInputRef.current) tdsInputRef.current.value = '';
    if (ktocInputRef.current) ktocInputRef.current.value = '';
  };

  const canSubmit = tdsState.isValid && ktocState.isValid && tdsState.file && ktocState.file;

  return (
    <div style={styles.container}>
      {/* Top Navigation */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.brandRow}>
            <img src="/assets/kone-logo.png" alt="KONE Logo" style={styles.logo} />
            <div style={styles.divider} />
            <div style={styles.titleBlock}>
              <span style={styles.appTitle}>TDS–KTOC Compliance Verification</span>
              <span style={styles.versionBadge}>v0.2.0 Hybrid Engine</span>
            </div>
          </div>
          <div style={styles.systemStatus}>
            <span style={styles.statusDot} />
            <span style={styles.statusText}>System Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Minimal Hero Section */}
        <section style={styles.heroSection}>
          <h1 style={styles.heroTitle}>Elevator Specification Verification</h1>
          <p style={styles.heroSubtitle}>
            Upload Customer Technical Data Sheet (Excel) and KONE KTOC Supply Line Order Form (PDF) to initiate automated, auditable compliance comparison.
          </p>
        </section>

        {/* Dual Upload Cards */}
        <div style={styles.uploadGrid}>
          {/* TDS Upload Card */}
          <div
            style={{
              ...styles.card,
              borderColor: isTdsDragging ? '#0055D4' : tdsState.isValid ? '#10B981' : '#E2E8F0',
              backgroundColor: isTdsDragging ? '#F0F7FF' : '#FFFFFF',
            }}
            onDragOver={(e) => { e.preventDefault(); setIsTdsDragging(true); }}
            onDragLeave={() => setIsTdsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsTdsDragging(false);
              handleTdsFile(e.dataTransfer.files?.[0]);
            }}
          >
            <div style={styles.cardHeader}>
              <div style={styles.iconCircle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0055D4" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="16" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h3 style={styles.cardTitle}>Customer TDS Workbook</h3>
                <span style={styles.cardFormatBadge}>.XLSX</span>
              </div>
            </div>

            <p style={styles.cardDesc}>
              Technical Data Sheet with elevator worksheets (e.g. 1.1_PL-FL-01 to SHL-02) containing customer requirements and parameters.
            </p>

            <div style={styles.dropZone}>
              {tdsState.isValid ? (
                <div style={styles.fileSelectedBox}>
                  <div style={styles.checkIcon}>✓</div>
                  <div style={styles.fileDetails}>
                    <span style={styles.fileName}>{tdsState.name}</span>
                    <span style={styles.fileSize}>{tdsState.size}</span>
                  </div>
                </div>
              ) : (
                <div style={styles.emptyDropPrompt}>
                  <span style={styles.dropPromptText}>Drag & drop workbook here, or</span>
                  <button
                    type="button"
                    style={styles.browseButton}
                    onClick={() => tdsInputRef.current?.click()}
                  >
                    Browse Excel File
                  </button>
                </div>
              )}
              {tdsState.error && <p style={styles.errorMessage}>{tdsState.error}</p>}
            </div>

            <input
              ref={tdsInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => handleTdsFile(e.target.files?.[0])}
            />
          </div>

          {/* KTOC Upload Card */}
          <div
            style={{
              ...styles.card,
              borderColor: isKtocDragging ? '#0055D4' : ktocState.isValid ? '#10B981' : '#E2E8F0',
              backgroundColor: isKtocDragging ? '#F0F7FF' : '#FFFFFF',
            }}
            onDragOver={(e) => { e.preventDefault(); setIsKtocDragging(true); }}
            onDragLeave={() => setIsKtocDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsKtocDragging(false);
              handleKtocFile(e.dataTransfer.files?.[0]);
            }}
          >
            <div style={styles.cardHeader}>
              <div style={styles.iconCircle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0055D4" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h3 style={styles.cardTitle}>KONE KTOC Order Form</h3>
                <span style={styles.cardFormatBadge}>.PDF</span>
              </div>
            </div>

            <p style={styles.cardDesc}>
              KONE ERP-generated global supply line order form with multi-column elevator specifications and dimensional tables.
            </p>

            <div style={styles.dropZone}>
              {ktocState.isValid ? (
                <div style={styles.fileSelectedBox}>
                  <div style={styles.checkIcon}>✓</div>
                  <div style={styles.fileDetails}>
                    <span style={styles.fileName}>{ktocState.name}</span>
                    <span style={styles.fileSize}>{ktocState.size}</span>
                  </div>
                </div>
              ) : (
                <div style={styles.emptyDropPrompt}>
                  <span style={styles.dropPromptText}>Drag & drop PDF here, or</span>
                  <button
                    type="button"
                    style={styles.browseButton}
                    onClick={() => ktocInputRef.current?.click()}
                  >
                    Browse PDF Document
                  </button>
                </div>
              )}
              {ktocState.error && <p style={styles.errorMessage}>{ktocState.error}</p>}
            </div>

            <input
              ref={ktocInputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleKtocFile(e.target.files?.[0])}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div style={styles.actionRow}>
          <button
            type="button"
            disabled={!canSubmit}
            style={{
              ...styles.primaryButton,
              backgroundColor: canSubmit ? '#0055D4' : '#CBD5E1',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
            onClick={() => {
              if (canSubmit && tdsState.file && ktocState.file) {
                onStartComparison(tdsState.file, ktocState.file);
              }
            }}
          >
            Start Compliance Verification
          </button>
          {(tdsState.file || ktocState.file) && (
            <button type="button" style={styles.clearLink} onClick={handleClear}>
              Reset documents
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  headerContent: {
    maxWidth: '1120px',
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
    width: 'auto',
    objectFit: 'contain',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#E2E8F0',
  },
  titleBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  appTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#0E1E38',
    letterSpacing: '-0.2px',
  },
  versionBadge: {
    fontSize: '11px',
    fontWeight: 500,
    backgroundColor: '#EEF4FF',
    color: '#0055D4',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  systemStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748B',
  },
  main: {
    flex: 1,
    maxWidth: '980px',
    margin: '0 auto',
    width: '100%',
    padding: '48px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heroSection: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  heroTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0E1E38',
    letterSpacing: '-0.5px',
    margin: '0 0 10px 0',
  },
  heroSubtitle: {
    fontSize: '15px',
    color: '#64748B',
    maxWidth: '620px',
    lineHeight: '1.5',
    margin: '0 auto',
  },
  uploadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
    width: '100%',
    marginBottom: '36px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1.5px dashed #E2E8F0',
    padding: '28px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  iconCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#EEF4FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#0E1E38',
    margin: '0 0 4px 0',
  },
  cardFormatBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#0055D4',
    letterSpacing: '0.5px',
  },
  cardDesc: {
    fontSize: '13px',
    color: '#64748B',
    lineHeight: '1.45',
    marginBottom: '20px',
    minHeight: '38px',
  },
  dropZone: {
    marginTop: 'auto',
    borderTop: '1px solid #F1F5F9',
    paddingTop: '16px',
  },
  emptyDropPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  dropPromptText: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  browseButton: {
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0055D4',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  fileSelectedBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #DCFCE7',
    borderRadius: '8px',
    padding: '12px 14px',
  },
  checkIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0,
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  fileName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#166534',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSize: {
    fontSize: '11px',
    color: '#15803D',
  },
  errorMessage: {
    fontSize: '12px',
    color: '#EF4444',
    marginTop: '8px',
    textAlign: 'center',
  },
  actionRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  primaryButton: {
    border: 'none',
    color: '#FFFFFF',
    padding: '12px 36px',
    borderRadius: '24px',
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    boxShadow: '0 2px 8px rgba(0, 85, 212, 0.25)',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
  },
  clearLink: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '13px',
    textDecoration: 'underline',
    cursor: 'pointer',
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
