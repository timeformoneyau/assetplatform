import { useNavigate } from 'react-router-dom';
import type { VehicleRecord } from '../types';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';
import { fmtDate, fmtKm, fmtMoney, truncate } from '../utils/fmt';

interface Props {
  records: VehicleRecord[];
  vehicleId: string;
  filter?: string;
}

export function Timeline({ records, vehicleId, filter = 'all' }: Props) {
  const navigate = useNavigate();

  const filtered = filter === 'all' ? records : records.filter(r => r.record_type === filter);
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div style={{
        border: '1.5px dashed var(--line-strong)',
        borderRadius: 'var(--radius)',
        padding: '48px 32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}>
        <div className="empty-icon"><Icon name="file" size={20} /></div>
        <h3 className="h-section" style={{ marginTop: 4 }}>No records yet</h3>
        <p className="muted" style={{ maxWidth: 300, fontSize: 13.5 }}>
          Add a record manually or upload a document to start building your vehicle's history.
        </p>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/vehicles/${vehicleId}/upload`)}>
            <Icon name="upload" size={12} /> Upload document
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/vehicles/${vehicleId}/records/new`)}>
            Add manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      {sorted.map(rec => (
        <div
          key={rec.id}
          className="timeline-ledger-row"
          data-st={rec.status}
          onClick={() => navigate(`/vehicles/${vehicleId}/records/${rec.id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate(`/vehicles/${vehicleId}/records/${rec.id}`)}
        >
          <div className="ledger-icon-chip">
            <Icon name={rec.record_type} size={13} />
          </div>
          <div className="ledger-body">
            <div className="ledger-summary">{rec.summary}</div>
            <div className="ledger-meta">
              {rec.provider_name && (
                <span className="ledger-provider">{truncate(rec.provider_name, 30)}</span>
              )}
              {rec.odometer != null && (
                <span className="ledger-odo">{fmtKm(rec.odometer)} km</span>
              )}
              {rec.cost != null && (
                <span className="ledger-odo">{fmtMoney(rec.cost)}</span>
              )}
            </div>
          </div>
          <div className="ledger-right">
            <div className="ledger-date">{fmtDate(rec.record_date)}</div>
            <StatusBadge status={rec.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
