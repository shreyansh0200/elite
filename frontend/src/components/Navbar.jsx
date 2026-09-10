import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut, Menu, X, Leaf, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const home =
    currentUser?.role === 'farmer'
      ? '/farmer/dashboard'
      : currentUser?.role === 'hubmanager'
      ? '/hub/dashboard'
      : currentUser?.role === 'customer'
      ? '/customer/dashboard'
      : '/';

  return (
    <nav className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={home} className="font-extrabold text-xl text-primary flex items-center gap-2">
          <Leaf />
          AgriSync
        </Link>

        <div className="hidden md:flex items-center gap-5 text-sm font-semibold">
          <Link to="/mandi">Mandi Rates</Link>
          <Link to="/consumer">Marketplace</Link>
          <Link to="/agent" className="flex gap-1 items-center">
            <MessageCircle className="w-4" />
            Ask AgriSync
          </Link>

          {currentUser?.role === 'farmer' && (
            <>
              <Link to="/farmer/sell">Sell a Crop</Link>
              <Link to="/farmer/notifications">
                <Bell className="w-5" />
              </Link>
            </>
          )}

          {currentUser?.role === 'hubmanager' && <Link to="/hub/grant">Manage Requests</Link>}

          {currentUser?.role === 'customer' && (
            <>
              <Link to="/customer/dashboard">My Purchases</Link>
              <Link to="/customer/tickets">Receiver Tickets</Link>
            </>
          )}

          {currentUser ? (
            <button onClick={logout} title="Log out">
              <LogOut className="w-5" />
            </button>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden p-4 bg-white border-t space-y-3">
          <Link className="block" to="/mandi">
            Mandi Rates
          </Link>
          <Link className="block" to="/consumer">
            Marketplace
          </Link>
          <Link className="block" to="/agent">
            Ask AgriSync
          </Link>
          {currentUser?.role === 'customer' && (
            <>
              <Link className="block" to="/customer/dashboard">My Purchases</Link>
              <Link className="block" to="/customer/tickets">Receiver Tickets</Link>
            </>
          )}
          {currentUser && (
            <button onClick={logout} className="text-red-600">
              Log Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
