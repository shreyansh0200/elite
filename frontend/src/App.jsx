import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import AgentWidget from './components/AgentWidget';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import MandiRates from './pages/MandiRates';
import Agent from './pages/Agent';
import ConsumerMarket from './pages/ConsumerMarket';
import FarmerDashboard from './pages/FarmerDashboard';
import SellGoods from './pages/SellGoods';
import Notifications from './pages/Notifications';
import HubManagerDashboard from './pages/HubManagerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen grid place-items-center">Loading AgriSync…</div>;
  }

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/mandi" element={<MandiRates />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/consumer" element={<ConsumerMarket />} />

          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedRoute roles={['farmer']}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/sell"
            element={
              <ProtectedRoute roles={['farmer']}>
                <SellGoods />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/notifications"
            element={
              <ProtectedRoute roles={['farmer']}>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hub/dashboard"
            element={
              <ProtectedRoute roles={['hubmanager']}>
                <HubManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hub/grant"
            element={
              <ProtectedRoute roles={['hubmanager']}>
                <HubManagerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute roles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/tickets"
            element={
              <ProtectedRoute roles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AgentWidget />
    </>
  );
}
