import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Icon } from '../components/Icon';
import { fmtDate, fmtKm, fmtMoney } from '../utils/fmt';
import { STATUS_LABEL, STATUS_DETAIL, RECORD_TYPE_LABELS } from '../types';
import type { RecordStatus } from '../types';

export function PassportPreview() {
  const { id: vehicleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();

  const vehicle = state.vehicles.find(v => v.id === vehicleId);
  const records = state.records
    .filter(r => r.vehicle_id === vehicleId)
    .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());

  if (!vehicle) {
    return (
      <div className="page-wrap" style={{ paddingTop: 40 }}>
        <p className="muted">Vehicle not found.</p>
        <button className="btn" onClick={() => navigate('/')}>Back</button>
      </div>
    );
  }

  const serviceCount = records.filter(r => r.record_type === 'service').length;
  const confirmedCount = records.filter(r => r.status === 'confirmed').length;
  const ownershipYears = Math.floor(
    (Date.now() - new Date(vehicle.ownership_start_date).getTime()) / (365.25 * 24 * 3600 * 1000)
  );
  const ownershipMonths = Math.floor(
    (Date.now() - new Date(vehicle.ownership_start_date).getTime()) / (30.44 * 24 * 3600 * 1000)
  );
  const ownershipLabel = ownershipYears >= 1
    ? `${ownershipYears}y ${ownershipMonths % 12}m`
    : `${ownershipMonths}mo`;

  const vinDisplay = vehicle.vin || 'Not recorded';

  return (
    <div className="page-wrap screen-enter" style={{ paddingTop: 28 }}>
      <Breadcrumb items={[
        { label: 'Vehicles', to: '/' },
        { label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, to: `/vehicles/${vehicleId}` },
        { label: 'Passport preview' },
      ]} />

      <PageHeader
        title="Passport preview"
        subtitle="An internal preview of what this passport could look like to a future buyer."
        right={
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-secondary btn-sm">
              <Icon name="download" size={12} /> Export PDF
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/vehicles/${vehicleId}`)}>
              <Icon name="arrow_left" size={12} /> Back to editing
            </button>
          </div>
        }
      />

      {/* Passport document — inner hairline frame via CSS ::before */}
      <div className="passport-doc">
        {/* Header: eyebrow + title + circular seal */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingBottom: 24,
          borderBottom: '1px solid var(--line-strong)',
          marginBottom: 28,
          gap: 24,
        }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--ink-faint)' }}>
              Vehicle passport · v0.4
            </div>
            <h1 className="h-display" style={{ marginBottom: 6 }}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            {vehicle.variant && (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--ink-soft)',
                marginTop: 6,
              }}>
                {vehicle.variant}
              </div>
            )}
          </div>
          {/* Circular verification seal */}
          <div style={{
            width: 80, height: 80,
            borderRadius: '50%',
            border: '2px solid var(--accent)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, gap: 2,
            background: 'var(--accent-soft)',
          }}>
            <Icon name="check" size={14} style={{ color: 'var(--accent)', marginBottom: 2 }} />
            {['VEHICLE', 'PASSPORT', vehicle.registration_number].map((t, i) => (
              <div key={i} style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 7.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent-ink)',
                lineHeight: 1.3,
              }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Vehicle facts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
          {[
            { label: 'Registration', val: vehicle.registration_number },
            { label: 'VIN', val: vinDisplay },
            { label: 'Body / Fuel', val: [vehicle.body_type, vehicle.fuel_type].filter(Boolean).join(' / ') || '—' },
            { label: 'Colour', val: vehicle.color ?? '—' },
          ].map(({ label, val }) => (
            <div key={label}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)', fontFeatureSettings: '"tnum"' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Stat tiles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          border: '1px solid var(--line-strong)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 28,
          background: 'var(--surface-2)',
        }}>
          {[
            { label: 'Records', val: String(records.length) },
            { label: 'Services', val: String(serviceCount) },
            { label: 'Confirmed', val: String(confirmedCount) },
            { label: 'Odometer', val: vehicle.current_odometer.toLocaleString('en-AU') + ' km' },
          ].map(({ label, val }, i) => (
            <div key={label} style={{
              padding: '14px 16px',
              borderRight: i < 3 ? '1px solid var(--line)' : 'none',
            }}>
              <div className="eyebrow" style={{ marginBottom: 5 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: 'var(--ink)', fontFeatureSettings: '"tnum"' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          borderLeft: '3px solid var(--line-strong)',
          padding: '11px 14px',
          borderRadius: 'var(--radius)',
          marginBottom: 28,
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.6, letterSpacing: '0.03em' }}>
            This passport summarises records added by the vehicle owner. Some records are supported by
            uploaded documents. The passport does not replace an independent inspection and does not
            guarantee vehicle condition.
          </p>
        </div>

        {/* History */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 className="h-section">Service &amp; ownership history</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>
              {records.length} record{records.length !== 1 ? 's' : ''}
            </span>
          </div>

          {records.length === 0 ? (
            <p className="muted" style={{ fontSize: 13.5 }}>No records have been added to this passport.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {records.map((rec, i) => (
                <div key={rec.id} style={{
                  display: 'flex',
                  gap: 12,
                  padding: '11px 0',
                  borderBottom: i < records.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div style={{ paddingTop: 4 }}>
                    <span className="status" data-st={rec.status}><span className="dot" /></span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13.5, marginBottom: 3, color: 'var(--ink)' }}>{rec.summary}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                        {RECORD_TYPE_LABELS[rec.record_type]} · {fmtDate(rec.record_date)}
                      </span>
                      {rec.odometer != null && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
                          {fmtKm(rec.odometer)} km
                        </span>
                      )}
                      <StatusBadge status={rec.status} />
                      {rec.doc_name && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
                          <Icon name="doc" size={10} style={{ marginRight: 2 }} /> Evidence
                        </span>
                      )}
                    </div>
                  </div>
                  {rec.cost != null && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)', flexShrink: 0, fontFeatureSettings: '"tnum"' }}>
                      {fmtMoney(rec.cost)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status legend */}
        <div style={{ marginBottom: 28 }}>
          <h2 className="h-section" style={{ marginBottom: 14 }}>What the labels mean</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(['confirmed', 'document', 'ai', 'declared'] as RecordStatus[]).map(st => (
              <div key={st} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span className="status" data-st={st} style={{ marginTop: 2 }}><span className="dot" /></span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>{STATUS_LABEL[st]}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{STATUS_DETAIL[st]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--line)',
          paddingTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span className="eyebrow">Generated · {fmtDate(new Date().toISOString().slice(0, 10))}</span>
          <span className="eyebrow">Logbook · Internal preview</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 20, paddingBottom: 40, letterSpacing: '0.04em' }}>
        Sharing with buyers will be available in a future update.
      </p>
    </div>
  );
}
