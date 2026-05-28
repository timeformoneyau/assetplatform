import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/PageHeader';
import { Breadcrumb } from '../components/Breadcrumb';
import { Icon } from '../components/Icon';

type UploadState = 'idle' | 'uploading' | 'parsing' | 'error';

export function Upload() {
  const { id: vehicleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const vehicle = state.vehicles.find(v => v.id === vehicleId);

  const runMockPipeline = () => {
    setUploadState('uploading');
    setTimeout(() => {
      setUploadState('parsing');
      setTimeout(() => {
        navigate(`/vehicles/${vehicleId}/review`);
      }, 1800);
    }, 1200);
  };

  const handleFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('This file type is not supported yet. Please upload a JPG, PNG, or PDF.');
      setUploadState('error');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('The file is too large. Maximum size is 20 MB.');
      setUploadState('error');
      return;
    }
    runMockPipeline();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (!vehicle) {
    return (
      <div className="page-wrap" style={{ paddingTop: 40 }}>
        <p className="muted">Vehicle not found.</p>
        <button className="btn" onClick={() => navigate('/')}>Back</button>
      </div>
    );
  }

  return (
    <div className="page-wrap screen-enter" style={{ paddingTop: 40, maxWidth: 680 }}>
      <Breadcrumb items={[
        { label: 'Vehicles', to: '/' },
        { label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, to: `/vehicles/${vehicleId}` },
        { label: 'Upload document' },
      ]} />
      <PageHeader
        title="Upload a document"
        subtitle="Upload a receipt, invoice, or inspection report. We’ll try to extract the important details — you’ll review everything before it’s added to your passport."
      />

      {/* Dropzone */}
      {uploadState === 'idle' && (
        <div
          className={`dropzone${dragOver ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius)',
            background: 'var(--line-2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-soft)', margin: '0 auto 16px',
          }}>
            <Icon name="upload" size={24} />
          </div>
          <h3 className="h-section" style={{ marginBottom: 8 }}>Drop a file here</h3>
          <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>JPG, PNG, or PDF, up to 20 MB.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
          >
            Choose file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>
      )}

      {uploadState === 'uploading' && (
        <div className="dropzone" style={{ cursor: 'default' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 20px' }} />
          <h3 className="h-section" style={{ marginBottom: 8 }}>Uploading…</h3>
          <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
            Sending your document securely.
          </p>
          <div className="row" style={{ gap: 6, justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i === 0 ? 'var(--accent)' : 'var(--line)',
              }} />
            ))}
          </div>
        </div>
      )}

      {uploadState === 'parsing' && (
        <div className="dropzone" style={{ cursor: 'default' }}>
          <div style={{ position: 'relative', width: 48, height: 48, margin: '0 auto 20px' }}>
            <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--warn)' }} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--warn)',
            }}>
              <Icon name="sparkle" size={16} />
            </div>
          </div>
          <h3 className="h-section" style={{ marginBottom: 8 }}>Reading the document</h3>
          <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
            Extracting details. You’ll review everything before it’s saved.
          </p>
          <div className="row" style={{ gap: 6, justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i <= 1 ? 'var(--accent)' : 'var(--line)',
              }} />
            ))}
          </div>
        </div>
      )}

      {uploadState === 'error' && (
        <div>
          <div className="banner banner-warn" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Upload failed</div>
            {errorMsg}
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-primary" onClick={() => { setUploadState('idle'); setErrorMsg(''); }}>
              Try again
            </button>
            <button className="btn btn-secondary" onClick={() => navigate(`/vehicles/${vehicleId}/records/new`)}>
              Enter details manually
            </button>
          </div>
        </div>
      )}

      {uploadState === 'idle' && (
        <>
          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="sparkle" size={16} style={{ color: 'var(--warn)' }} />
                <div style={{ fontWeight: 500, fontSize: 14 }}>Extract details</div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                We’ll try to read the date, provider, odometer, and cost from your document.
              </p>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />
                <div style={{ fontWeight: 500, fontSize: 14 }}>You confirm</div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                You review and edit everything before it becomes a confirmed record.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/vehicles/${vehicleId}/records/new`)}
            >
              <Icon name="arrow_left" size={13} /> Enter details manually instead
            </button>
          </div>
        </>
      )}
    </div>
  );
}
