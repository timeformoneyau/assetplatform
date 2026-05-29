import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { Vehicle, VehicleRecord } from '../types';
import { loadVehicles, saveVehicles, loadRecords, saveRecords, genId } from '../data/storage';

interface State {
  vehicles: Vehicle[];
  records: VehicleRecord[];
  toast: string;
}

type Action =
  | { type: 'ADD_VEHICLE'; vehicle: Vehicle }
  | { type: 'ADD_RECORD'; record: VehicleRecord }
  | { type: 'UPDATE_RECORD'; record: VehicleRecord }
  | { type: 'DELETE_RECORD'; id: string }
  | { type: 'SHOW_TOAST'; msg: string }
  | { type: 'CLEAR_TOAST' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_VEHICLE': {
      const vehicles = [action.vehicle, ...state.vehicles];
      saveVehicles(vehicles);
      return { ...state, vehicles };
    }
    case 'ADD_RECORD': {
      const records = [action.record, ...state.records];
      saveRecords(records);
      return { ...state, records };
    }
    case 'UPDATE_RECORD': {
      const records = state.records.map(r => r.id === action.record.id ? action.record : r);
      saveRecords(records);
      return { ...state, records };
    }
    case 'DELETE_RECORD': {
      const records = state.records.filter(r => r.id !== action.id);
      saveRecords(records);
      return { ...state, records };
    }
    case 'SHOW_TOAST':
      return { ...state, toast: action.msg };
    case 'CLEAR_TOAST':
      return { ...state, toast: '' };
    default:
      return state;
  }
}

interface AppContextValue {
  state: State;
  createVehicle: (data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => string;
  addRecord: (data: Omit<VehicleRecord, 'id' | 'created_at' | 'updated_at'>) => string;
  updateRecord: (record: VehicleRecord) => void;
  deleteRecord: (id: string) => void;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    vehicles: loadVehicles(),
    records: loadRecords(),
    toast: '',
  });

  const createVehicle = useCallback((data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
    const id = genId('v');
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_VEHICLE', vehicle: { id, ...data, created_at: now, updated_at: now } });
    return id;
  }, []);

  const addRecord = useCallback((data: Omit<VehicleRecord, 'id' | 'created_at' | 'updated_at'>): string => {
    const id = genId('r');
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_RECORD', record: { id, ...data, created_at: now, updated_at: now } });
    return id;
  }, []);

  const updateRecord = useCallback((record: VehicleRecord) => {
    dispatch({ type: 'UPDATE_RECORD', record: { ...record, updated_at: new Date().toISOString() } });
  }, []);

  const deleteRecord = useCallback((id: string) => {
    dispatch({ type: 'DELETE_RECORD', id });
  }, []);

  const showToast = useCallback((msg: string) => {
    dispatch({ type: 'SHOW_TOAST', msg });
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2200);
  }, []);

  return (
    <AppContext.Provider value={{ state, createVehicle, addRecord, updateRecord, deleteRecord, showToast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
