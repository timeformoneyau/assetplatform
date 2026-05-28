import { useNavigate } from 'react-router-dom';
import type { VehicleRecord } from '../types';
import { RECORD_TYPE_LABELS } from '../types';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';
import { fmtDate, fmtKm, truncate } from '../utils/fmt';

interface Props {
  records: VehicleRecord[];
  vehicleId: string;
  filter?: string;
}

export function Timeline({ records, vehicleId, filter = 'all' }: Props) {
  const navigate = useNavigate();

  const filtered = filter === 'all'
    ? records
    : records.filter(r => r.record_type === filter);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div style={{
        border: '1.5px dashed var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: '48px 32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--line-2)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)',
        }}>
          <Icon name="file" size={20} />
        </div>
        <h3 className="h-section" style={{ marginTop: 4 }}>No records yet</h3>
        <p className="muted" style={{ maxWidth: 300, fontSize: 14 }}>
          Add a record manually or upload a document to start building your vehicle’s history.
        </p>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/vehicles/${vehicleId}/upload`)}
          >
            <Icon name="upload" size={13} /> Upload document
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/vehicles/${vehicleId}/records/new`)}
          >
            Add manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      <div className="timeline-rail" />
      {sorted.map(rec => (
        <div key={rec.id} className="timeline-item">
          <div className="timeline-dot-wrap">
            <div className="timeline-dot" data-st={rec.status} />
          </div>
          <div
            className="timeline-card"
            onClick={() => navigate(`/vehicles/${vehicleId}/records/${rec.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate(`/vehicles/${vehicleId}/records/${rec.id}`)}
          >
            <div className="timeline-card-top">
              <div className="timeline-card-title">
                <Icon name={rec.record_type} size={14} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
                {rec.summary}
              </div>
              <div className="timeline-card-date">{fmtDate(rec.record_date)}</div>
            </div>
            {rec.notes && (
              <div className="timeline-card-notes">{rec.notes}</div>
            )}
            <div className="timeline-card-meta">
              {rec.odometer != null && (
                <span className="meta">{fmtKm(rec.odometer)}</span>
              )}
              {rec.provider_name && (
                <span className="meta" style={{ color: 'var(--ink-soft)' }}>
                  {truncate(rec.provider_name, 28)}
                </span>
              )}
              <StatusBadge status={rec.status} />
              {rec.doc_name && (
                <span className="meta" style={{ color: 'var(--ink-faint)' }}>
                  <Icon name="doc" size={10} style={{ marginRight: 3 }} />
                  {truncate(rec.doc_name, 22)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
