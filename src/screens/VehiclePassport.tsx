import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { Icon } from '../components/Icon';
import { Timeline } from '../components/Timeline';
import { fmtDate, fmtKm } from '../utils/fmt';
import { RECORD_TYPE_LABELS, STATUS_LABEL, STATUS_DETAIL } from '../types';
import type { RecordStatus, RecordType } from '../types';

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
  const lastService = serviceRecords[0];
  const ownershipYears = Math.floor(
    (Date.now() - new Date(vehicle.ownership_start_date).getTime()) / (365.25 * 24 * 3600 * 1000)
  );
  const ownershipMonths = Math.floor(
    (Date.now() - new Date(vehicle.ownership_start_date).getTime()) / (30.44 * 24 * 3600 * 1000)
  );
  const ownershipLabel = ownershipYears >= 1
    ? `${ownershipYears}y ${ownershipMonths % 12}m`
    : `${ownershipMonths} months`;

  const vinSuffix = vehicle.vin ? vehicle.vin.slice(-6) : 'VIN pending';

  const statusCounts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<RecordStatus, number>);

  return (
    <div className="page-wrap screen-enter" style={{ paddingTop: 32 }}>
      <Breadcrumb items={[
        { label: 'Vehicles', to: '/' },
        { label: `${vehicle.year} ${vehicle.make} ${vehicle.model}` },
      ]} />

      {/* Vehicle header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: 28,
        paddingBottom: 28,
        borderBottom: '1px solid var(--line)',
        marginBottom: 24,
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {vehicle.registration_number}
            {vehicle.color ? ` · ${vehicle.color}` : ''}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 38,
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: '-0.012em',
            marginBottom: 6,
          }}>
            {vehicle.year} {vehicle.make}{' '}
            <em style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>{vehicle.model}</em>
          </h1>
          {vehicle.variant && (
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 20 }}>
              {vehicle.variant}
            </div>
          )}
          <div className="row" style={{ gap: 8, marginTop: vehicle.variant ? 0 : 20 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/vehicles/${id}/records/new`)}
            >
              <Icon name="plus" size={13} /> Add record
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/vehicles/${id}/upload`)}
            >
              <Icon name="upload" size={13} /> Upload document
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/vehicles/${id}/preview`)}
            >
              <Icon name="eye" size={13} /> Preview passport
            </button>
          </div>
        </div>
        <div style={{
          height: 180,
          borderRadius: 'var(--radius-lg)',
          background: 'radial-gradient(ellipse at 40% 40%, var(--tan-soft), var(--accent-soft))',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 11px, rgba(0,0,0,0.04) 11px 12px)',
          }} />
          <div className="meta" style={{
            position: 'absolute', bottom: 12, left: 14,
            color: 'var(--ink-soft)', fontSize: 10,
          }}>
            Passport · {vinSuffix}
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="stat-strip" style={{ marginBottom: 36 }}>
        <div className="stat-cell">
          <div className="stat-label">Odometer</div>
          <div className="stat-value mono">{vehicle.current_odometer.toLocaleString('en-AU')}</div>
          <div className="stat-sub">km</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Records</div>
          <div className="stat-value">{records.length}</div>
          <div className="stat-sub">{serviceRecords.length} service{serviceRecords.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Last service</div>
          <div className="stat-value" style={{ fontSize: lastService ? 18 : 26 }}>
            {lastService ? fmtDate(lastService.record_date) : '—'}
          </div>
          <div className="stat-sub">{lastService ? lastService.provider_name ?? '' : 'None recorded'}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">In your care</div>
          <div className="stat-value">{ownershipLabel}</div>
          <div className="stat-sub">since {fmtDate(vehicle.ownership_start_date)}</div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="two-col">
        {/* Left: timeline */}
        <div>
          <div className="section-header">
            <h2 className="h-section">Timeline</h2>
            <div className="seg-control">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  className={filter === f.id ? 'active' : ''}
                  onClick={() => setFilter(f.id)}
                >{f.label}</button>
              ))}
            </div>
          </div>
          <Timeline records={records} vehicleId={id!} filter={filter} />
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              { key: 'VIN', val: vehicle.vin ?? 'Not recorded' },
              { key: 'Ownership from', val: fmtDate(vehicle.ownership_start_date) },
            ].map(({ key, val }) => (
              <div key={key} className="detail-row">
                <span className="detail-key">{key}</span>
                <span className="detail-val mono" style={{ fontSize: 12.5 }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Record statuses legend */}
          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Record statuses</div>
            {(['confirmed', 'document', 'ai', 'declared'] as RecordStatus[]).map(st => (
              <div key={st} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                <span className="status" data-st={st} style={{ marginTop: 1 }}><span className="dot" /></span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>
                    {STATUS_LABEL[st]}
                    {statusCounts[st] ? (
                      <span style={{ marginLeft: 6, color: 'var(--ink-faint)', fontWeight: 400 }}>
                        &times;{statusCounts[st]}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.4, marginTop: 2 }}>
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
