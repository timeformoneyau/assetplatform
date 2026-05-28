import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { fmtKm, timeAgo } from '../utils/fmt';
import { StatusBadge } from '../components/StatusBadge';
import { RECORD_TYPE_LABELS } from '../types';

export function Dashboard() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { vehicles, records } = state;

  const recentRecords = [...records]
    .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())
    .slice(0, 4);

  return (
    <div className="page-wrap screen-enter" style={{ paddingTop: 40 }}>
      <PageHeader
        eyebrow="YOUR ACCOUNT"
        title="Your vehicles"
        subtitle="Build a service and maintenance history over time — useful today, and for a future buyer."
        right={
          <button className="btn btn-primary" onClick={() => navigate('/vehicles/new')}>
            <Icon name="plus" size={14} />
            Add vehicle
          </button>
        }
      />

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="car" size={32} />
          </div>
          <h2 className="h-section">Add your first vehicle</h2>
          <p className="muted" style={{ maxWidth: 380, textAlign: 'center' }}>
            Start by adding your vehicle. You’ll be able to build a service and maintenance history over time
            — useful for yourself today, and for a future buyer later on.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/vehicles/new')}>
            <Icon name="plus" size={14} />
            Add vehicle
          </button>
        </div>
      ) : (
        <>
          <div className="vehicle-grid">
            {vehicles.map(v => {
              const vRecords = records.filter(r => r.vehicle_id === v.id);
              return (
                <div
                  key={v.id}
                  className="vehicle-card"
                  onClick={() => navigate(`/vehicles/${v.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/vehicles/${v.id}`)}
                >
                  <div className="vehicle-art">
                    <div className="vehicle-art-caption">{v.color ?? 'Unknown colour'}</div>
                  </div>
                  <div className="vehicle-body">
                    <div className="vehicle-title">
                      {v.year} {v.make} <em style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>{v.model}</em>
                    </div>
                    <div className="vehicle-rego">{v.registration_number}</div>
                    <div className="vehicle-stats">
                      {fmtKm(v.current_odometer)} &middot; {vRecords.length} record{vRecords.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
            <div
              className="vehicle-card vehicle-card-add"
              onClick={() => navigate('/vehicles/new')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate('/vehicles/new')}
            >
              <Icon name="plus" size={20} />
              <span>Add another vehicle</span>
            </div>
          </div>

          {recentRecords.length > 0 && (
            <section style={{ marginTop: 48 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Recent activity</div>
              <div className="card" style={{ padding: 0 }}>
                {recentRecords.map((rec, i) => {
                  const v = vehicles.find(v => v.id === rec.vehicle_id);
                  return (
                    <div
                      key={rec.id}
                      onClick={() => navigate(`/vehicles/${rec.vehicle_id}/records/${rec.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 20px',
                        borderBottom: i < recentRecords.length - 1 ? '1px solid var(--line)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.14s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--line-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--line-2)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--ink-soft)', flexShrink: 0,
                      }}>
                        <Icon name={rec.record_type} size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{rec.summary}</div>
                        <div className="meta" style={{ color: 'var(--ink-faint)' }}>
                          {v ? `${v.year} ${v.make} ${v.model}` : ''} &middot; {RECORD_TYPE_LABELS[rec.record_type]}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <StatusBadge status={rec.status} />
                        <span className="meta" style={{ color: 'var(--ink-faint)' }}>{timeAgo(rec.record_date)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
