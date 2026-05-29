import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { Icon } from '../components/Icon';
import { Timeline } from '../components/Timeline';
import { fmtDate, fmtKm } from '../utils/fmt';
import { STATUS_LABEL, STATUS_DETAIL } from '../types';
import type { RecordStatus } from '../types';

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'service', label: 'Service' },
  { id: 'repair', label: 'Repair' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'registration', label: 'Registration' },
];

export function VehiclePassport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const [filter, setFilter] = useState('all');

  const vehicle = state.vehicles.find(v => v.id === id);
  const records = state.records
    .filter(r => r.vehicle_id === id)
    .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());

  if (!vehicle) {
    return (
      <div className="page-wrap" style={{ paddingTop: 40 }}>
        <p className="muted">Vehicle not found.</p>
        <button className="btn" onClick={() => navigate('/')}>Back to dashboard</button>
      </div>
    );
  }

  const serviceRecords = records.filter(r => r.record_type === 'service');
  const ownershipYears = Math.floor(
    (Date.now() - new Date(vehicle.ownership_start_date).getTime()) / (365.25 * 24 * 3600 * 1000)
  );
  const ownershipMonths = Math.floor(
    (Date.now() - new Date(vehicle.ownership_start_date).getTime()) / (30.44 * 24 * 3600 * 1000)
  );
  const ownershipLabel = ownershipYears >= 1
    ? `${ownershipYears}y ${ownershipMonths % 12}m`
    : `${ownershipMonths}mo`;

  const vinDisplay = vehicle.vin ? vehicle.vin : 'NOT RECORDED';
  const vinShort = vehicle.vin ? vehicle.vin.slice(-6) : 'PENDING';
  const refId = id ? id.toUpperCase().slice(0, 8) : 'UNKNOWN';
  const lastUpdated = vehicle.updated_at ? fmtDate(vehicle.updated_at) : '—';

  const statusCounts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<RecordStatus, number>);

  return (
    <div className="page-wrap screen-enter" style={{ paddingTop: 28 }}>
      <Breadcrumb items={[
        { label: 'Vehicles', to: '/' },
        { label: `${vehicle.year} ${vehicle.make} ${vehicle.model}` },
      ]} />

      {/* ── Vehicle header: 2-col grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.35fr 1fr',
        gap: 32,
        paddingBottom: 28,
        borderBottom: '2px solid var(--ink)',
        marginBottom: 24,
        alignItems: 'stretch',
      }}>
        {/* Left: identity + actions */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Vehicle record · {vehicle.registration_number}
          </div>
          <h1 className="h-display" style={{ marginBottom: 8 }}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          {(vehicle.variant || vehicle.color) && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-soft)',
              marginBottom: 20,
            }}>
              {[vehicle.variant, vehicle.color].filter(Boolean).join(' · ')}
            </div>
          )}
          <div className="row" style={{ gap: 8, marginTop: 'auto', paddingTop: 20 }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/vehicles/${id}/records/new`)}>
              <Icon name="plus" size={12} /> Add record
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/vehicles/${id}/upload`)}>
              <Icon name="upload" size={12} /> Upload document
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/vehicles/${id}/preview`)}>
              <Icon name="eye" size={12} /> Preview passport
            </button>
          </div>
        </div>

        {/* Right: registration certificate panel */}
        <div className="vehicle-art" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180 }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Vehicle Passport</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-2)',
              marginBottom: 16,
            }}>
              Record on file
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { key: 'VIN', val: vinShort },
                { key: 'Reg', val: vehicle.registration_number },
                { key: 'Year', val: String(vehicle.year) },
                { key: 'Body', val: vehicle.body_type ?? '—' },
              ].map(({ key, val }) => (
                <div key={key}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 2 }}>
                    {key}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--ink)', letterSpacing: '0.06em', fontFeatureSettings: '"tnum"' }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            position: 'relative', zIndex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            marginTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>REF {refId}</span>
            <span>Updated {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className="stat-strip" style={{ marginBottom: 32 }}>
        <div className="stat-cell">
          <div className="stat-label">Odometer</div>
          <div className="stat-value">{vehicle.current_odometer.toLocaleString('en-AU')}</div>
          <div className="stat-sub">km</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Records</div>
          <div className="stat-value">{records.length}</div>
          <div className="stat-sub">{serviceRecords.length} service{serviceRecords.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Ownership since</div>
          <div className="stat-value">{ownershipLabel}</div>
          <div className="stat-sub">{fmtDate(vehicle.ownership_start_date)}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Last updated</div>
          <div className="stat-value" style={{ fontSize: 14, paddingTop: 4 }}>{lastUpdated}</div>
          <div className="stat-sub">VIN ···{vinShort}</div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="two-col">
        {/* Left: timeline */}
        <div>
          <div className="section-header">
            <h2 className="h-section">Timeline</h2>
            <div className="seg-control">
              {FILTERS.map(f => (
                <button key={f.id} className={filter === f.id ? 'active' : ''} onClick={() => setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <Timeline records={records} vehicleId={id!} filter={filter} />
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Vehicle details */}
          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Vehicle details</div>
            {[
              { key: 'Make', val: vehicle.make },
              { key: 'Model', val: vehicle.model },
              { key: 'Year', val: String(vehicle.year) },
              { key: 'Variant', val: vehicle.variant ?? '—' },
              { key: 'Fuel', val: vehicle.fuel_type ?? '—' },
              { key: 'Body', val: vehicle.body_type ?? '—' },
              { key: 'VIN', val: vinDisplay },
              { key: 'Since', val: fmtDate(vehicle.ownership_start_date) },
            ].map(({ key, val }) => (
              <div key={key} className="detail-row">
                <span className="detail-key">{key}</span>
                <span className="detail-val">{val}</span>
              </div>
            ))}
          </div>

          {/* Record status legend */}
          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Record statuses</div>
            {(['confirmed', 'document', 'ai', 'declared'] as RecordStatus[]).map(st => (
              <div key={st} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                <span className="status" data-st={st} style={{ marginTop: 2 }}><span className="dot" /></span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 1 }}>
                    {STATUS_LABEL[st]}
                    {statusCounts[st] ? (
                      <span style={{ marginLeft: 6, color: 'var(--ink-faint)', fontWeight: 400, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                        ×{statusCounts[st]}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                    {STATUS_DETAIL[st]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
