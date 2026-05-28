import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();

  const pathParts = location.pathname.split('/');
  const vehicleId = pathParts[2];
  const activeVehicle = vehicleId ? state.vehicles.find(v => v.id === vehicleId) : null;

  const onDashboard = location.pathname === '/';
  const onPassport = location.pathname.startsWith('/vehicles/') && pathParts.length <= 3;

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <div className="brand" onClick={() => navigate('/')}>
          <div className="brand-mark" />
          <span>Logbook</span>
        </div>
        <div className="nav-links">
          <button
            className={onDashboard ? 'active' : ''}
            onClick={() => navigate('/')}
          >Vehicles</button>
          {activeVehicle && (
            <button
              className={onPassport ? 'active' : ''}
              onClick={() => navigate(`/vehicles/${activeVehicle.id}`)}
            >{activeVehicle.year} {activeVehicle.make}</button>
          )}
        </div>
        <div className="nav-right">
          <span className="meta" style={{ color: 'var(--ink-faint)' }}>v0.4 · MVP</span>
          <div className="avatar">AM</div>
        </div>
      </div>
    </nav>
  );
}
