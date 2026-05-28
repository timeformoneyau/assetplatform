import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/PageHeader';
import { Breadcrumb } from '../components/Breadcrumb';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { stripNumeric } from '../utils/fmt';
import type { FuelType, BodyType } from '../types';

const FUEL_TYPES: FuelType[] = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in hybrid', 'Electric', 'LPG'];
const BODY_TYPES: BodyType[] = ['Sedan', 'Hatchback', 'Wagon', 'SUV', 'Ute', 'Van', 'Coupe'];

export function AddVehicle() {
  const navigate = useNavigate();
  const { createVehicle, showToast } = useApp();
  const [showOptional, setShowOptional] = useState(false);

  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '',
    registration_number: '',
    current_odometer: '',
    ownership_start_date: '',
    vin: '',
    variant: '',
    fuel_type: '' as FuelType | '',
    body_type: '' as BodyType | '',
    color: '',
    purchase_odometer: '',
    notes: '',
  });

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const requiredFilled =
    form.make.trim() &&
    form.model.trim() &&
    form.year.trim() &&
    form.registration_number.trim() &&
    form.current_odometer.trim() &&
    form.ownership_start_date.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredFilled) return;
    const id = createVehicle({
      make: form.make.trim(),
      model: form.model.trim(),
      year: parseInt(form.year, 10),
      registration_number: form.registration_number.trim().toUpperCase(),
      current_odometer: stripNumeric(form.current_odometer),
      ownership_start_date: form.ownership_start_date,
      vin: form.vin.trim().toUpperCase() || null,
      variant: form.variant.trim() || null,
      fuel_type: (form.fuel_type as FuelType) || null,
      body_type: (form.body_type as BodyType) || null,
      color: form.color.trim() || null,
      purchase_odometer: form.purchase_odometer ? stripNumeric(form.purchase_odometer) : null,
      notes: form.notes.trim() || null,
    });
    showToast('Vehicle passport created');
    navigate(`/vehicles/${id}`);
  };

  return (
    <div className="page-wrap screen-enter" style={{ paddingTop: 40, maxWidth: 760 }}>
      <Breadcrumb items={[
        { label: 'Vehicles', to: '/' },
        { label: 'Add vehicle' },
      ]} />
      <PageHeader
        title="Add a vehicle"
        subtitle="Just the essentials. You can add the rest later — VIN, photos, and history records can all be filled in over time."
      />

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-grid">
            <Field label="Make *">
              <input
                type="text"
                value={form.make}
                onChange={e => set('make', e.target.value)}
                placeholder="e.g. Toyota"
                required
              />
            </Field>
            <Field label="Model *">
              <input
                type="text"
                value={form.model}
                onChange={e => set('model', e.target.value)}
                placeholder="e.g. Camry"
                required
              />
            </Field>
            <Field label="Year *">
              <input
                type="number"
                value={form.year}
                onChange={e => set('year', e.target.value)}
                placeholder="e.g. 2020"
                min={1900}
                max={new Date().getFullYear() + 1}
                data-mono
                required
              />
            </Field>
            <Field label="Registration number *">
              <input
                type="text"
                value={form.registration_number}
                onChange={e => set('registration_number', e.target.value.toUpperCase())}
                placeholder="e.g. ABC 123"
                required
              />
            </Field>
            <Field label="Current odometer (km) *">
              <input
                type="text"
                value={form.current_odometer}
                onChange={e => set('current_odometer', e.target.value)}
                placeholder="e.g. 85,000"
                inputMode="numeric"
                data-mono
                required
              />
            </Field>
            <Field label="Ownership start date *">
              <input
                type="date"
                value={form.ownership_start_date}
                onChange={e => set('ownership_start_date', e.target.value)}
                required
              />
            </Field>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowOptional(!showOptional)}
            style={{ marginBottom: 12, fontSize: 13.5 }}
          >
            <Icon name={showOptional ? 'chevron_down' : 'chevron_right'} size={14} />
            {showOptional ? 'Hide' : 'Show'} optional details
          </button>

          {showOptional && (
            <div className="card">
              <div className="form-grid">
                <Field label="VIN" helper="17-character vehicle identifier (can be added later)." span={2}>
                  <input
                    type="text"
                    value={form.vin}
                    onChange={e => set('vin', e.target.value.toUpperCase())}
                    placeholder="e.g. JF1BS9KC9JG012847"
                    maxLength={17}
                  />
                </Field>
                <Field label="Variant / trim">
                  <input
                    type="text"
                    value={form.variant}
                    onChange={e => set('variant', e.target.value)}
                    placeholder="e.g. SR5 Premium"
                  />
                </Field>
                <Field label="Colour">
                  <input
                    type="text"
                    value={form.color}
                    onChange={e => set('color', e.target.value)}
                    placeholder="e.g. Crystal White Pearl"
                  />
                </Field>
                <Field label="Fuel type">
                  <select value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)}>
                    <option value="">Select…</option>
                    {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Body type">
                  <select value={form.body_type} onChange={e => set('body_type', e.target.value)}>
                    <option value="">Select…</option>
                    {BODY_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Odometer at purchase (km)">
                  <input
                    type="text"
                    value={form.purchase_odometer}
                    onChange={e => set('purchase_odometer', e.target.value)}
                    inputMode="numeric"
                    data-mono
                    placeholder="e.g. 12,000"
                  />
                </Field>
                <Field label="Notes" span={2}>
                  <textarea
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Any notes about this vehicle…"
                    rows={3}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        <div className="row" style={{ gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!requiredFilled}
          >
            Create vehicle passport →
          </button>
        </div>
      </form>
    </div>
  );
}
