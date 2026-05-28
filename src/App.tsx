import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { TopNav } from './components/TopNav';
import { Toast } from './components/Toast';
import { Dashboard } from './screens/Dashboard';
import { AddVehicle } from './screens/AddVehicle';
import { VehiclePassport } from './screens/VehiclePassport';
import { AddRecord } from './screens/AddRecord';
import { Upload } from './screens/Upload';
import { ReviewParsed } from './screens/ReviewParsed';
import { RecordDetail } from './screens/RecordDetail';
import { PassportPreview } from './screens/PassportPreview';

export default function App() {
  const { state } = useApp();

  return (
    <div className="app">
      <TopNav />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles/new" element={<AddVehicle />} />
          <Route path="/vehicles/:id" element={<VehiclePassport />} />
          <Route path="/vehicles/:id/records/new" element={<AddRecord />} />
          <Route path="/vehicles/:id/upload" element={<Upload />} />
          <Route path="/vehicles/:id/review" element={<ReviewParsed />} />
          <Route path="/vehicles/:id/records/:recordId" element={<RecordDetail />} />
          <Route path="/vehicles/:id/preview" element={<PassportPreview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toast msg={state.toast} />
    </div>
  );
}
