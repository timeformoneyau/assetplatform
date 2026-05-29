import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { fmtDate, fmtKm, timeAgo } from '../utils/fmt';
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
    <div className="page-wrap screen-enter" style={{ paddingTop: 36 }}>
      <PageHeader
        eyebrow="YOUR ACCOUNT"
        title="Your vehicles"
        subtitle="Build a service and maintenance history over time — useful today, and for a future buyer."
        right={
          <button className="btn btn-primary" onClick={() => navigate('/vehicles/new')}>
            <Icon name="plus" size={13} /> Add vehicle
          </button>
        }
      />

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="car" size={28} />
          </div>
          <h2 className="h-section">Add your first vehicle</h2>
          <p className="muted" style={{ maxWidth: 360, textAlign: 'center', fontSize: 14 }}>
            Start by adding your vehicle. You'll be able to build a service and maintenance history
            over time — useful for yourself today, and for a future buyer later on.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/vehicles/new')}>
            <Icon name="plus" size={13} /> Add vehicle
          </button>
        </div>
      ) : (
        <>
          <div className="vehicle-grid">
            {vehicles.map(v => {
              const vRecords = records.filter(r => r.vehicle_id === v.id);
              const vinDisplay = v.vin ? v.vin.slice(-6) : 'PENDING';
              const identityParts = [v.variant, v.body_type, v.color].filter(Boolean);
              const lastUpdated = vRecords.length > 0
                ? fmtDate(vRecords.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at)
                : '—';

              return (
                <div
                  key={v.id}
                  className="vehicle-card"
                  onClick={() => navigate(`/vehicles/${v.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/vehicles/${v.id}`)}
                >
                  <div className="vehicle-card-title">{v.year} {v.make} {v.model}</div>
                  <div className="vehicle-card-rego">{v.registration_number}</div>
                  {identityParts.length > 0 && (
                    <div className="vehicle-card-identity">{identityParts.join(' · ')}</div>
                  )}
                  <div className="vehicle-card-grid">
                    <div className="vehicle-card-grid-cell">
                      <div className="vehicle-card-grid-label">Odometer</div>
                      <div className="vehicle-card-grid-value">{fmtKm(v.current_odometer)} km</div>
                    </div>
                    <div className="vehicle-card-grid-cell">
                      <div className="vehicle-card-grid-label">Records</div>
                      <div className="vehicle-card-grid-value">{vRecords.length}</div>
                    </div>
                    <div className="vehicle-card-grid-cell">
                      <div className="vehicle-card-grid-label">VIN</div>
                      <div className="vehicle-card-grid-value">···{vinDisplay}</div>
                    </div>
                    <div className="vehicle-card-grid-cell">
                      <div className="vehicle-card-grid-label">Updated</div>
                      <div className="vehicle-card-grid-value" style={{ fontSize: 11, fontWeight: 400 }}>{lastUpdated}</div>
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
              <Icon name="plus" size={18} />
              <span>Add another vehicle</span>
            </div>
          </div>

          {recentRecords.length > 0 && (
            <section style={{ marginTop: 48 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Recent activity</div>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--line-strong)',
                borderRadius: 'var(--radius)',
              }}>
                {recentRecords.map((rec, i) => {
                  const v = vehicles.find(veh => veh.id === rec.vehicle_id);
                  return (
                    <div
                      key={rec.id}
                      onClick={() => navigate(`/vehicles/${rec.vehicle_id}/records/${rec.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px 18px',
                        borderBottom: i < recentRecords.length - 1 ? '1px solid var(--line)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.11s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: 28, height: 28,
                        background: 'var(--surface-2)',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--radius)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--ink-soft)', flexShrink: 0,
                      }}>
                        <Icon name={rec.record_type} size={13} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13.5, marginBottom: 2, color: 'var(--ink)' }}>
                          {rec.summary}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                          {v ? `${v.year} ${v.make} ${v.model}` : ''} · {RECORD_TYPE_LABELS[rec.record_type]} · {fmtDate(rec.record_date)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <StatusBadge status={rec.status} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
                          {timeAgo(rec.record_date)}
                        </span>
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
