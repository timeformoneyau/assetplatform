import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/PageHeader';
import { Breadcrumb } from '../components/Breadcrumb';
import { Icon } from '../components/Icon';
import { MOCK_EXTRACTION } from '../data/mockData';
import { RECORD_TYPE_LABELS } from '../types';
import type { RecordType, ParsedExtraction } from '../types';

const TOP_TYPES: RecordType[] = ['service', 'repair', 'inspection', 'registration', 'other', 'test'];

export function ReviewParsed() {
  const { id: vehicleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, addRecord, updateRecord, showToast } = useApp();

  const vehicle = state.vehicles.find(v => v.id === vehicleId);

  const ext = useMemo<ParsedExtraction>(() => {
    try {
      const stored = sessionStorage.getItem('vp_pending_extraction');
      if (stored) return JSON.parse(stored) as ParsedExtraction;
    } catch {}
    return MOCK_EXTRACTION;
  }, []);

  const docHash = useMemo<string | null>(() => {
    return sessionStorage.getItem('vp_pending_doc_hash');
  }, []);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem('vp_pending_extraction');
      sessionStorage.removeItem('vp_pending_doc_hash');
    };
  }, []);

  const [fields, setFields] = useState({
    record_type: String(ext.fields.type.value ?? 'other') as RecordType,
    record_date: String(ext.fields.date.value ?? ''),
    odometer: ext.fields.odometer.value != null ? String(ext.fields.odometer.value) : '',
    provider_name: String(ext.fields.provider.value ?? ''),
    summary: String(ext.fields.summary.value ?? ''),
    cost: ext.fields.cost.value != null ? String(ext.fields.cost.value) : '',
  });

  const setField = (k: string, v: string) => setFields(f => ({ ...f, [k]: v }));

  const lowConfidenceFields = Object.entries(ext.fields).filter(([, f]) => f.confidence < 0.8);

  const handleConfirm = () => {
    if (!vehicleId) return;
    const now = new Date().toISOString();
    const baseData = {
      vehicle_id: vehicleId,
      record_type: fields.record_type,
      record_date: fields.record_date,
      odometer: fields.odometer ? parseInt(fields.odometer.replace(/[^\d]/g, ''), 10) : null,
      provider_name: fields.provider_name || null,
      summary: fields.summary,
      notes: null,
      cost: fields.cost ? parseFloat(fields.cost.replace(/[^0-9.]/g, '')) : null,
      status: 'confirmed' as const,
      source_type: 'upload' as const,
      doc_name: ext.doc_name,
      confirmed_at: now,
      hcs_transaction_id: null as string | null,
      hcs_sequence_number: null as number | null,
      hcs_network: null as 'testnet' | 'mainnet' | null,
      doc_hash: docHash,
    };

    const recordId = addRecord(baseData);
    showToast('Record confirmed & added');
    navigate(`/vehicles/${vehicleId}`);

    // Fire-and-forget: anchor to Hedera, silently update record on success
    fetch('/api/anchor-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: { id: recordId, ...baseData } }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.transaction_id) return;
        updateRecord({
          id: recordId,
          ...baseData,
          created_at: now,
          updated_at: now,
          hcs_transaction_id: data.transaction_id,
          hcs_sequence_number: data.sequence_number ?? null,
          hcs_network: data.network ?? 'testnet',
          doc_hash: docHash,
        });
      })
      .catch(() => {});
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
    <div className="page-wrap screen-enter" style={{ paddingTop: 40 }}>
      <Breadcrumb items={[
        { label: 'Vehicles', to: '/' },
        { label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, to: `/vehicles/${vehicleId}` },
        { label: 'Review extracted details' },
      ]} />
      <PageHeader
        title="We found the following details"
        subtitle="Please check these before adding them to your passport. We’ve highlighted anything we’re less sure about."
      />

      {lowConfidenceFields.length > 0 && (
        <div className="banner banner-warn" style={{ marginBottom: 24 }}>
          <strong>{lowConfidenceFields.length} field{lowConfidenceFields.length > 1 ? 's' : ''} need{lowConfidenceFields.length === 1 ? 's' : ''} a closer look.</strong>{' '}
          We’re less confident about:{' '}
          {lowConfidenceFields.map(([, f]) => f.label).join(', ')}.
        </div>
      )}

      <div className="two-col-5-6" style={{ marginBottom: 80 }}>
        {/* Left: document preview */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Source document</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 12 }}>{ext.doc_name}</div>
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: '24px 20px',
            aspectRatio: '1 / 1.4',
            fontFamily: 'Courier, monospace',
            fontSize: 11,
            color: 'var(--ink-2)',
            lineHeight: 1.6,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 12, whiteSpace: 'pre-line' }}>
              {ext.vendor_block}
            </div>
            <div style={{ borderTop: '1px solid var(--line)', marginBottom: 8, paddingTop: 8 }}>
              <strong>TAX INVOICE</strong> · {ext.doc_type}
            </div>
            <div style={{ marginBottom: 4 }}>
              Date: <span style={{ background: 'rgba(179,106,31,0.15)', padding: '1px 3px', borderRadius: 2 }}>
                {ext.fields.date.value as string}
              </span>
            </div>
            <div style={{ marginBottom: 4 }}>
              Vehicle km: <span style={{ background: 'rgba(46,93,79,0.12)', padding: '1px 3px', borderRadius: 2 }}>
                {(ext.fields.odometer.value as number).toLocaleString()}
              </span>
            </div>
            <div style={{ marginBottom: 8 }}>
              Service: <span style={{ background: 'rgba(179,106,31,0.25)', padding: '1px 3px', borderRadius: 2 }}>
                {ext.fields.summary.value as string}
              </span>
            </div>
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 8, marginBottom: 4 }}>
              {ext.items.map((item, i) => <div key={i}>&bull; {item}</div>)}
            </div>
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8, fontWeight: 700 }}>
              TOTAL: <span style={{ background: 'rgba(46,93,79,0.12)', padding: '1px 3px', borderRadius: 2 }}>
                ${(ext.fields.cost.value as number).toFixed(2)}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
            Page 1 of 1 · Highlights show extracted values
          </div>
        </div>

        {/* Right: editable fields */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Record type */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-soft)' }}>{ext.fields.type.label}</label>
                  <ConfidenceChip confidence={ext.fields.type.confidence} />
                </div>
                <div className="chip-row">
                  {TOP_TYPES.map(rt => (
                    <button
                      key={rt}
                      type="button"
                      className={`chip${fields.record_type === rt ? ' active' : ''}`}
                      onClick={() => setField('record_type', rt)}
                    >
                      <Icon name={rt} size={12} />
                      {RECORD_TYPE_LABELS[rt]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <ParsedFieldRow
                label={ext.fields.date.label}
                confidence={ext.fields.date.confidence}
              >
                <input
                  type="date"
                  value={fields.record_date}
                  onChange={e => setField('record_date', e.target.value)}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 14.5,
                    color: 'var(--ink)', background: 'var(--surface-2)',
                    border: '1px solid var(--line)', borderRadius: 'var(--radius)',
                    padding: '9px 11px', width: '100%', outline: 'none',
                  }}
                />
              </ParsedFieldRow>

              {/* Odometer */}
              <ParsedFieldRow label={ext.fields.odometer.label} confidence={ext.fields.odometer.confidence}>
                <input
                  type="text"
                  value={fields.odometer}
                  onChange={e => setField('odometer', e.target.value)}
                  inputMode="numeric"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 14.5,
                    color: 'var(--ink)', background: 'var(--surface-2)',
                    border: '1px solid var(--line)', borderRadius: 'var(--radius)',
                    padding: '9px 11px', width: '100%', outline: 'none',
                  }}
                />
              </ParsedFieldRow>

              {/* Provider */}
              <ParsedFieldRow label={ext.fields.provider.label} confidence={ext.fields.provider.confidence}>
                <input
                  type="text"
                  value={fields.provider_name}
                  onChange={e => setField('provider_name', e.target.value)}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 14.5,
                    color: 'var(--ink)', background: 'var(--surface-2)',
                    border: '1px solid var(--line)', borderRadius: 'var(--radius)',
                    padding: '9px 11px', width: '100%', outline: 'none',
                  }}
                />
              </ParsedFieldRow>

              {/* Summary */}
              <ParsedFieldRow label={ext.fields.summary.label} confidence={ext.fields.summary.confidence}>
                <input
                  type="text"
                  value={fields.summary}
                  onChange={e => setField('summary', e.target.value)}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 14.5,
                    color: 'var(--ink)', background: 'var(--surface-2)',
                    border: ext.fields.summary.confidence < 0.8
                      ? '1px solid var(--warn)'
                      : '1px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    padding: '9px 11px', width: '100%', outline: 'none',
                  }}
                />
              </ParsedFieldRow>

              {/* Cost */}
              <ParsedFieldRow label={ext.fields.cost.label} confidence={ext.fields.cost.confidence}>
                <input
                  type="text"
                  value={fields.cost}
                  onChange={e => setField('cost', e.target.value)}
                  inputMode="decimal"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 14.5,
                    color: 'var(--ink)', background: 'var(--surface-2)',
                    border: '1px solid var(--line)', borderRadius: 'var(--radius)',
                    padding: '9px 11px', width: '100%', outline: 'none',
                  }}
                />
              </ParsedFieldRow>

              {/* Line items */}
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-soft)', marginBottom: 8 }}>Line items found</div>
                <div style={{
                  background: 'var(--line-2)', borderRadius: 'var(--radius)',
                  padding: '10px 14px', fontSize: 13,
                }}>
                  {ext.items.map((item, i) => (
                    <div key={i} style={{ padding: '3px 0', color: 'var(--ink-2)' }}>&bull; {item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--line)',
        padding: '16px var(--page-x)',
        zIndex: 40,
      }}>
        <div style={{
          maxWidth: 'var(--max)', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>Ready to save?</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
              This record will be marked <strong>User confirmed</strong> and the document kept as evidence.
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button
              className="btn btn-ghost"
              onClick={() => navigate(`/vehicles/${vehicleId}`)}
            >
              Cancel
            </button>
            <button className="btn btn-accent" onClick={handleConfirm}>
              <Icon name="check" size={14} /> Confirm & add to timeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidenceChip({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const low = confidence < 0.8;
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 10.5,
      padding: '2px 7px',
      borderRadius: 'var(--radius)',
      background: low ? 'var(--warn-soft)' : 'var(--accent-soft)',
      color: low ? 'var(--warn)' : 'var(--accent-ink)',
      letterSpacing: '0.03em',
    }}>
      {low ? `Low confidence · ${pct}%` : `${pct}% confident`}
    </span>
  );
}

function ParsedFieldRow({
  label, confidence, children,
}: {
  label: string; confidence: number; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-soft)' }}>{label}</label>
        <ConfidenceChip confidence={confidence} />
      </div>
      {children}
    </div>
  );
}
