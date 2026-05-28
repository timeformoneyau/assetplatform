import type { Vehicle, VehicleRecord } from '../types';
import { MOCK_VEHICLES, MOCK_RECORDS } from './mockData';

const VEHICLES_KEY = 'vp_vehicles';
const RECORDS_KEY = 'vp_records';

export function loadVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    return raw ? JSON.parse(raw) : MOCK_VEHICLES;
  } catch {
    return MOCK_VEHICLES;
  }
}

export function saveVehicles(vehicles: Vehicle[]): void {
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
}

export function loadRecords(): VehicleRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) : MOCK_RECORDS;
  } catch {
    return MOCK_RECORDS;
  }
}

export function saveRecords(records: VehicleRecord[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function genId(prefix: string): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
