import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { StatusBadge } from '../components/StatusBadge';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { fmtDate, fmtKm, fmtMoney } from '../utils/fmt';
import { STATUS_LABEL, STATUS_DETAIL, RECORD_TYPE_LABELS } from '../types';
import type { RecordStatus } from '../types';

function statusHistory(status: RecordStatus, sourceType: 'manual' | 'upload', recordDate: string) {
  const base = [{ label: sourceType === 'upload' ? 'Document uploaded' : 'Record created by owner', date: recordDate, st: 'declared' as RecordStatus }];
  if (status === 'document') {
    return [...base, { label: 'Document attached to record', date: recordDate, st: 'document' as RecordStatus }];
  }
  if (status === 'ai') {
    return [
      ...base,
      { label: 'Document attached to record', date: recordDate, st: 'document' as RecordStatus },
      { label: 'Details extracted from uploaded document', date: recordDate, st: 'ai' as RecordStatus },
    ];
  }
  if (status === 'confirmed') {
    return [
      ...base,
      { label: 'Document attached to record', date: recordDate, st: 'document' as RecordStatus },
      { label: 'Details extracted from uploaded document', date: recordDate, st: 'ai' as RecordStatus },
      { label: 'Owner reviewed and confirmed', date: recordDate, st: 'confirmed' as RecordStatus },
    ];
  }
  return base;
}

export function RecordDetail() {
  const { id: vehicleId, recordId } = useParams<{ id: string; recordId: string }>();
  const navigate = useNavigate();
  const { state, deleteRecord, showToast } = useApp();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const vehicle = state.vehicles.find(v => v.id === vehicleId);
  const record = state.records.find(r => r.id === recordId);

  if (!vehicle || !record) {
    return (
      <div className="page-wrap" style={{ paddingTop: 40 }}>
        <p className="muted">Record not found.</p>
        <button className="btn" onClick={() => navigate('/')}>Back</button>
      </div>
    );
  }

  const history = statusHistory(record.status, record.source_type, record.record_date);

  const handleDelete = () => {
    deleteRecord(record.id);
    showToast('Record deleted');
    navigate(`/vehicles/${vehicleId}`);
  };

  return (
    <div className="page-wrap screen-enter" style={{ paddingTop: 32 }}>
      <Breadcrumb items={[
        { label: 'Vehicles', to: '/' },
        { label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, to: `/vehicles/${vehicleId}` },
        { label: record.summary },
      ]} />

      <div className="two-col">
        {/* Left */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {RECORD_TYPE_LABELS[record.record_type]} record
          </div>
          <h1 className="h-page" style={{ marginBottom: 12 }}>{record.summary}</h1>
          <div className="row" style={{ gap: 12, marginBottom: 28 }}>
            <span className="meta" style={{ color: 'var(--ink-soft)' }}>{fmtDate(record.record_date)}</span>
            {record.odometer != null && (
              <span className="meta" style={{ color: 'var(--ink-soft)' }}>{fmtKm(record.odometer)}</span>
            )}
            <StatusBadge status={record.status} />
          </div>

          {/* Detail card */}
          <div className="card" style={{ marginBottom: 24 }}>
            {[
              { key: 'Provider', val: record.provider_name ?? '—' },
              { key: 'Cost', val: fmtMoney(record.cost) },
              { key: 'Odometer', val: record.odometer != null ? fmtKm(record.odometer) : '—' },
              { key: 'Date', val: fmtDate(record.record_date) },
            ].map(({ key, val }) => (
              <div key={key} className="detail-row">
                <span className="detail-key">{key}</span>
                <span className="detail-val">{val}</span>
              </div>
            ))}
            {record.notes && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 6 }}>Notes</div>
                <p style={{ fontSize: 14, lineHeight: 1.6 }}>{record.notes}</p>
              </div>
            )}
          </div>

          {/* Status history */}
          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 14 }}>Status history</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {history.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingBottom: i < history.length - 1 ? 14 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <span className="status" data-st={item.st}><span className="dot" /></span>
                    {i < history.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: 'var(--line)', marginTop: 4, minHeight: 20 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < history.length - 1 ? 0 : 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>{item.label}</div>
                    <div className="meta" style={{ color: 'var(--ink-faint)' }}>{fmtDate(item.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="row" style={{ gap: 10, marginTop: 24, justifyContent: 'space-between' }}>
            <div className="row" style={{ gap: 10 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/vehicles/${vehicleId}/records/${recordId}/edit`)}
              >
                <Icon name="edit" size={13} /> Edit record
              </button>
              {!record.doc_name && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/vehicles/${vehicleId}/upload`)}
                >
                  <Icon name="upload" size={13} /> Attach evidence
                </button>
              )}
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}>
              <Icon name="trash" size={13} /> Delete
            </button>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Evidence */}
          {record.doc_name ? (
            <div className="card">
              <div className="eyebrow" style={{ marginBottom: 12 }}>Attached evidence</div>
              <div className="row" style={{ gap: 12, marginBottom: 14 }}>
                <div className="doc-thumb">
                  <Icon name="doc" size={16} style={{ color: 'var(--tan)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, wordBreak: 'break-all' }}>{record.doc_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
                    {record.doc_name.endsWith('.pdf') ? 'PDF' : record.doc_name.endsWith('.jpg') || record.doc_name.endsWith('.jpeg') ? 'JPG' : 'PNG'}
                    {' · uploaded with record'}
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                <Icon name="eye" size={13} /> View document
              </button>
            </div>
          ) : (
            <div className="card" style={{ background: 'var(--tan-soft)', borderColor: 'var(--tan)' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>No evidence attached</div>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 14 }}>
                Attach a receipt, invoice, or report to support this record.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/vehicles/${vehicleId}/upload`)}
              >
                <Icon name="upload" size={13} /> Attach document
              </button>
            </div>
          )}

          {/* What this means */}
          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 10 }}>What this means</div>
            <div style={{ marginBottom: 8 }}>
              <StatusBadge status={record.status} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              {STATUS_DETAIL[record.status]}
            </p>
          </div>

          {/* Hedera anchor */}
          {record.hcs_transaction_id ? (
            <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--accent)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name="check" size={14} style={{ color: '#fff' }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--accent-ink)' }}>
                  Anchored to Hedera
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 12 }}>
                This record's details were submitted to the Hedera Consensus Service at the time of confirmation — creating a tamper-proof audit entry.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <div className="detail-row" style={{ background: 'none', padding: 0 }}>
                  <span className="detail-key">Network</span>
                  <span className="detail-val" style={{ textTransform: 'capitalize' }}>
                    {record.hcs_network ?? 'testnet'}
                  </span>
                </div>
                {record.hcs_sequence_number != null && (
                  <div className="detail-row" style={{ background: 'none', padding: 0 }}>
                    <span className="detail-key">Sequence</span>
                    <span className="detail-val" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
                      #{record.hcs_sequence_number}
                    </span>
                  </div>
                )}
                <div className="detail-row" style={{ background: 'none', padding: 0 }}>
                  <span className="detail-key">Transaction</span>
                  <span className="detail-val" style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    wordBreak: 'break-all', maxWidth: 160,
                  }}>
                    {record.hcs_transaction_id}
                  </span>
                </div>
                {record.doc_hash && (
                  <div className="detail-row" style={{ background: 'none', padding: 0 }}>
                    <span className="detail-key">Doc SHA-256</span>
                    <span className="detail-val" style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                      wordBreak: 'break-all', maxWidth: 160, color: 'var(--ink-soft)',
                    }}>
                      {record.doc_hash}
                    </span>
                  </div>
                )}
              </div>
              <a
                href={`https://hashscan.io/${record.hcs_network ?? 'testnet'}/transaction/${encodeURIComponent(record.hcs_transaction_id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', textDecoration: 'none' }}
              >
                <Icon name="eye" size={13} /> View on Hashscan
              </a>
            </div>
          ) : record.status === 'confirmed' ? (
            <div className="card" style={{ borderStyle: 'dashed' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Hedera anchor</div>
              <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', lineHeight: 1.5 }}>
                Hedera anchoring is not configured. Add <code style={{ fontSize: 11 }}>HEDERA_ACCOUNT_ID</code>, <code style={{ fontSize: 11 }}>HEDERA_PRIVATE_KEY</code>, and <code style={{ fontSize: 11 }}>HEDERA_TOPIC_ID</code> to your Vercel environment variables.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Delete modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <h2 className="h-section" style={{ marginBottom: 12 }}>Delete this record?</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 24 }}>
          <strong>{record.summary}</strong> will be permanently removed from your timeline. This cannot be undone.
        </p>
        <div className="row" style={{ gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setDeleteOpen(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
            onClick={handleDelete}
          >
            <Icon name="trash" size={14} /> Delete record
          </button>
        </div>
      </Modal>
    </div>
  );
}
