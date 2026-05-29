import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/PageHeader';
import { Breadcrumb } from '../components/Breadcrumb';
import { Icon } from '../components/Icon';

type UploadState = 'idle' | 'selected' | 'uploading' | 'parsing' | 'error';

interface SelectedFile {
  file: File;
  previewUrl: string | null; // null for PDFs
  isImage: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_BYTES = 20 * 1024 * 1024;

export function Upload() {
  const { id: vehicleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();

  // Two hidden inputs: one general (supports PDF + images), one camera-capture (images only).
  // Both are always mounted so refs are always valid regardless of which state is active.
  const fileRef   = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [dragOver,    setDragOver]    = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [selected,    setSelected]    = useState<SelectedFile | null>(null);

  const vehicle = state.vehicles.find(v => v.id === vehicleId);

  // Revoke the object URL when the selected file changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (selected?.previewUrl) URL.revokeObjectURL(selected.previewUrl);
    };
  }, [selected]);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const sha256Hex = async (file: File): Promise<string> => {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const runPipeline = async () => {
    if (!selected) return;
    setUploadState('uploading');
    try {
      const [file_base64, docHash] = await Promise.all([
        toBase64(selected.file),
        sha256Hex(selected.file),
      ]);
      setUploadState('parsing');
      const response = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64,
          file_type: selected.file.type,
          file_name: selected.file.name,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(body.error ?? 'Upload failed');
      }
      const extraction = await response.json();
      sessionStorage.setItem('vp_pending_extraction', JSON.stringify(extraction));
      sessionStorage.setItem('vp_pending_doc_hash', docHash);
      navigate(`/vehicles/${vehicleId}/review`);
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Something went wrong. Please try again.');
      setUploadState('error');
    }
  };

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg('This file type is not supported yet. Please upload a JPG, PNG, or PDF.');
      setUploadState('error');
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMsg('The file is too large. Maximum size is 20 MB.');
      setUploadState('error');
      return;
    }
    const isImage = file.type.startsWith('image/');
    // Revoke previous URL before creating a new one.
    if (selected?.previewUrl) URL.revokeObjectURL(selected.previewUrl);
    setSelected({ file, previewUrl: isImage ? URL.createObjectURL(file) : null, isImage });
    setUploadState('selected');
  };

  const handleClear = () => {
    if (selected?.previewUrl) URL.revokeObjectURL(selected.previewUrl);
    setSelected(null);
    setUploadState('idle');
    if (fileRef.current)   fileRef.current.value   = '';
    if (cameraRef.current) cameraRef.current.value = '';
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
    // Reset so the same file can be re-selected after a clear.
    e.target.value = '';
  };

  // Always-mounted hidden inputs — shared across all states via refs.
  const hiddenInputs = (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />
      {/*
        capture="environment" requests the rear camera on mobile browsers that
        support it (iOS Safari, Android Chrome). On desktop it falls back to a
        standard image file picker. We use accept="image/*" here because camera
        capture always produces an image — PDF capture doesn't apply.
      */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />
    </>
  );

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
      {hiddenInputs}

      <Breadcrumb items={[
        { label: 'Vehicles', to: '/' },
        { label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, to: `/vehicles/${vehicleId}` },
        { label: 'Upload document' },
      ]} />
      <PageHeader
        title="Upload a document"
        subtitle="Upload a receipt, invoice, or inspection report. We'll try to extract the important details — you'll review everything before it's added to your passport."
      />

      {/* ── Idle ── */}
      {uploadState === 'idle' && (
        <>
          <div
            className={`dropzone${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            aria-label="Drop a file here or click to choose"
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
            <div className="row" style={{ gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
              >
                <Icon name="upload" size={14} /> Choose file
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={e => { e.stopPropagation(); cameraRef.current?.click(); }}
                title="Take a photo with your camera"
              >
                <Icon name="camera" size={14} /> Take photo
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="sparkle" size={16} style={{ color: 'var(--warn)' }} />
                <div style={{ fontWeight: 500, fontSize: 14 }}>Extract details</div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                We'll try to read the date, provider, odometer, and cost from your document.
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

      {/* ── Selected: preview + confirm ── */}
      {uploadState === 'selected' && selected && (
        <div>
          {/* Image preview */}
          {selected.isImage && selected.previewUrl && (
            <div style={{
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: 'var(--surface-2)',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxHeight: 420,
            }}>
              <img
                src={selected.previewUrl}
                alt="Document preview"
                style={{ maxWidth: '100%', maxHeight: 420, display: 'block', objectFit: 'contain' }}
              />
            </div>
          )}

          {/* File info row — shown for both images and PDFs */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            marginBottom: 20,
          }}>
            <div style={{
              width: 36, height: 44, background: 'var(--tan-soft)',
              borderRadius: 4, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, color: 'var(--tan)',
            }}>
              <Icon name={selected.isImage ? 'image' : 'doc'} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, wordBreak: 'break-all', marginBottom: 2 }}>
                {selected.file.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                {selected.isImage ? 'Image' : 'PDF'} · {(selected.file.size / 1024).toFixed(0)} KB
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleClear}>
              <Icon name="x" size={13} /> Remove file
            </button>
            <div className="row" style={{ gap: 10 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="rotate" size={13} /> Change file
              </button>
              {/* Only show camera option for non-PDF replacement */}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => cameraRef.current?.click()}
                title="Retake with camera"
              >
                <Icon name="camera" size={13} /> Retake photo
              </button>
              <button className="btn btn-accent" onClick={runPipeline}>
                Continue <Icon name="arrow_right" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Uploading ── */}
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

      {/* ── Parsing ── */}
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
            Extracting details. You'll review everything before it's saved.
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

      {/* ── Error ── */}
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
    </div>
  );
}
