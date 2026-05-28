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

  const vinDisplay = vehicle.vin ? vehicle.vin : 'Not recorded';

  return (
    <div className="page-wrap screen-enter" style={{ paddingTop: 32 }}>
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
              <Icon name="download" size={13} /> Export PDF
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/vehicles/${vehicleId}`)}
            >
              <Icon name="arrow_left" size={13} /> Back to editing
            </button>
          </div>
        }
      />

      {/* Passport document */}
      <div className="passport-doc">
        {/* Head */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingBottom: 24,
          borderBottom: '1.5px solid var(--line)',
          marginBottom: 28,
          gap: 24,
        }}>
          <div>
            <div className="meta" style={{ marginBottom: 10, color: 'var(--ink-faint)' }}>
              VEHICLE PASSPORT · V0.4
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: '-0.012em',
            }}>
              {vehicle.year} {vehicle.make}{' '}
              <em style={{ color: 'var(--ink-soft)' }}>{vehicle.model}</em>
            </h1>
            {vehicle.variant && (
              <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>{vehicle.variant}</div>
            )}
          </div>
          {/* Seal */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: '1.5px solid var(--accent)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, gap: 1,
            background: 'var(--surface-2)',
          }}>
            {['VEHICLE', 'PASSPORT', vehicle.registration_number].map((t, i) => (
              <div key={i} style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                lineHeight: 1.4,
              }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Identifying details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
          marginBottom: 28,
        }}>
          {[
            { label: 'Registration', val: vehicle.registration_number },
            { label: 'VIN', val: vinDisplay },
            { label: 'Body / Fuel', val: [vehicle.body_type, vehicle.fuel_type].filter(Boolean).join(' / ') || '—' },
            { label: 'Colour', val: vehicle.color ?? '—' },
          ].map(({ label, val }) => (
            <div key={label}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
              <div className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Headline stats strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 28,
        }}>
          {[
            { label: 'Records', val: String(records.length) },
            { label: 'Services logged', val: String(serviceCount) },
            { label: 'Current odometer', val: vehicle.current_odometer.toLocaleString('en-AU') + ' km' },
            { label: 'In current ownership', val: ownershipLabel },
          ].map(({ label, val }, i) => (
            <div key={label} style={{
              padding: '14px 18px',
              borderRight: i < 3 ? '1px solid var(--line)' : 'none',
            }}>
              <div className="eyebrow" style={{ marginBottom: 5 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          borderLeft: '3px solid var(--tan)',
          paddingLeft: 16,
          marginBottom: 32,
          background: 'var(--tan-soft)',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            This passport summarises records added by the vehicle owner. Some records may be supported by
            uploaded documents. The passport does not replace an independent inspection and does not
            guarantee vehicle condition.
          </p>
        </div>

        {/* Timeline section */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400 }}>
              Service &amp; ownership history
            </h2>
            <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>{records.length} record{records.length !== 1 ? 's' : ''}</span>
          </div>

          {records.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>No records have been added to this passport.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {records.map((rec, i) => (
                <div key={rec.id} style={{
                  display: 'flex',
                  gap: 14,
                  paddingBottom: 14,
                  borderBottom: i < records.length - 1 ? '1px solid var(--line-2)' : 'none',
                  marginBottom: i < records.length - 1 ? 14 : 0,
                }}>
                  <div style={{ paddingTop: 3 }}>
                    <span className="status" data-st={rec.status}><span className="dot" /></span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16, fontWeight: 400,
                      marginBottom: 4,
                    }}>{rec.summary}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="meta" style={{ color: 'var(--ink-faint)' }}>
                        {RECORD_TYPE_LABELS[rec.record_type]} · {fmtDate(rec.record_date)}
                      </span>
                      {rec.odometer != null && (
                        <span className="meta" style={{ color: 'var(--ink-faint)' }}>{fmtKm(rec.odometer)}</span>
                      )}
                      <StatusBadge status={rec.status} />
                      {rec.doc_name && (
                        <span className="meta" style={{ color: 'var(--ink-soft)' }}>
                          <Icon name="doc" size={10} style={{ marginRight: 2 }} /> Evidence attached
                        </span>
                      )}
                    </div>
                  </div>
                  {rec.cost != null && (
                    <div className="mono" style={{ fontSize: 13, color: 'var(--ink-soft)', flexShrink: 0 }}>
                      {fmtMoney(rec.cost)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status legend */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, marginBottom: 14 }}>
            What the labels mean
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(['confirmed', 'document', 'ai', 'declared'] as RecordStatus[]).map(st => (
              <div key={st} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span className="status" data-st={st} style={{ marginTop: 2 }}><span className="dot" /></span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{STATUS_LABEL[st]}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{STATUS_DETAIL[st]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--line)',
          paddingTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span className="meta" style={{ color: 'var(--ink-faint)' }}>Generated · {fmtDate(new Date().toISOString().slice(0, 10))}</span>
          <span className="meta" style={{ color: 'var(--ink-faint)' }}>Logbook · Internal preview</span>
        </div>
      </div>

      {/* Below-doc hint */}
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-faint)', marginTop: 24, paddingBottom: 40 }}>
        Sharing this passport with buyers will be available in a future update.
      </p>
    </div>
  );
}
