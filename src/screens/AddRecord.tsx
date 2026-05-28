import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/PageHeader';
import { Breadcrumb } from '../components/Breadcrumb';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { stripNumeric } from '../utils/fmt';
import { RECORD_TYPE_LABELS } from '../types';
import type { RecordType } from '../types';

const RECORD_TYPES: RecordType[] = [
  'service', 'repair', 'inspection', 'registration',
  'warranty', 'tyres', 'battery', 'recall', 'other',
];

export function AddRecord() {
  const { id: vehicleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, addRecord, showToast } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const vehicle = state.vehicles.find(v => v.id === vehicleId);

  const [form, setForm] = useState({
    record_type: 'service' as RecordType,
    record_date: '',
    odometer: '',
    summary: '',
    provider_name: '',
    cost: '',
    notes: '',
  });
  const [docName, setDocName] = useState<string | null>(null);

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const canSubmit = form.record_date && form.summary.trim();
  const statusPreview = docName ? 'document' : 'declared';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDocName(file.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !vehicleId) return;
    addRecord({
      vehicle_id: vehicleId,
      record_type: form.record_type,
      record_date: form.record_date,
      odometer: form.odometer ? stripNumeric(form.odometer) : null,
      summary: form.summary.trim(),
      provider_name: form.provider_name.trim() || null,
      cost: form.cost ? parseFloat(form.cost.replace(/[^0-9.]/g, '')) : null,
      notes: form.notes.trim() || null,
      status: statusPreview,
      source_type: 'manual',
      doc_name: docName,
      confirmed_at: null,
    });
    showToast('Record added to timeline');
    navigate(`/vehicles/${vehicleId}`);
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
    <div className="page-wrap screen-enter" style={{ paddingTop: 40, maxWidth: 760 }}>
      <Breadcrumb items={[
        { label: 'Vehicles', to: '/' },
        { label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, to: `/vehicles/${vehicleId}` },
        { label: 'Add record' },
      ]} />
      <PageHeader
        title="Add a record"
        subtitle="Add the date and a short summary. You can attach a receipt, invoice, or report if you have one."
      />

      <form onSubmit={handleSubmit}>
        <div className="card">
          {/* Record type chips */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-soft)', marginBottom: 8 }}>Record type *</div>
            <div className="chip-row">
              {RECORD_TYPES.map(rt => (
                <button
                  key={rt}
                  type="button"
                  className={`chip${form.record_type === rt ? ' active' : ''}`}
                  onClick={() => set('record_type', rt)}
                >
                  <Icon name={rt} size={12} />
                  {RECORD_TYPE_LABELS[rt]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <Field label="Date *">
              <input
                type="date"
                value={form.record_date}
                onChange={e => set('record_date', e.target.value)}
                required
              />
            </Field>
            <Field label="Odometer (km)">
              <input
                type="text"
                value={form.odometer}
                onChange={e => set('odometer', e.target.value)}
                placeholder="e.g. 85,000"
                inputMode="numeric"
                data-mono
              />
            </Field>
            <Field label="Summary *" span={2}>
              <input
                type="text"
                value={form.summary}
                onChange={e => set('summary', e.target.value)}
                placeholder="e.g. Annual service at 80,000km"
                required
              />
            </Field>
            <Field label="Provider / source">
              <input
                type="text"
                value={form.provider_name}
                onChange={e => set('provider_name', e.target.value)}
                placeholder="e.g. City Toyota Service"
              />
            </Field>
            <Field label="Cost (AUD)">
              <input
                type="text"
                value={form.cost}
                onChange={e => set('cost', e.target.value)}
                placeholder="e.g. 450.00"
                inputMode="decimal"
                data-mono
              />
            </Field>
            <Field label="Notes" span={2}>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any additional notes…"
                rows={3}
              />
            </Field>
          </div>

          {/* Evidence attach */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-soft)', marginBottom: 8 }}>Supporting evidence</div>
            {docName ? (
              <div className="row" style={{
                gap: 10, padding: '10px 14px',
                background: 'var(--tan-soft)', borderRadius: 'var(--radius)',
                border: '1px solid var(--tan)',
              }}>
                <Icon name="doc" size={16} style={{ color: 'var(--tan)' }} />
                <span style={{ fontSize: 13.5, flex: 1 }}>{docName}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setDocName(null); if (fileRef.current) fileRef.current.value = ''; }}
                >
                  <Icon name="x" size={12} /> Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="upload" size={13} /> Attach document
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Status preview */}
        <div className="banner banner-tan" style={{ marginTop: 16 }}>
          This record will be saved as{' '}
          <strong>{statusPreview === 'document' ? 'Document attached' : 'Owner declared'}</strong>.
          {statusPreview === 'declared' && (
            <> Attach a document to increase credibility.
            </>
          )}
        </div>

        <div className="row" style={{ gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`/vehicles/${vehicleId}`)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            <Icon name="check" size={14} /> Save record
          </button>
        </div>
      </form>
    </div>
  );
}
