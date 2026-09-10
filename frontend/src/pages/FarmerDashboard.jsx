import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Plus, ArrowRight, IndianRupee } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STATUS_STYLE = {
  confirmed: 'bg-emerald-100 text-emerald-800',
  waitlisted: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-200 text-gray-700',
  received: 'bg-emerald-100 text-emerald-800',
};

const STATUS_LABEL = {
  confirmed: 'CONFIRMED',
  waitlisted: 'WAITLISTED',
  rejected: 'CANCELLED BY HUB',
  cancelled: 'CANCELLED',
  completed: 'COMPLETED',
  received: 'CROP RECEIVED AT HUB',
  pending: 'PENDING',
};

export default function FarmerDashboard() {
  const { currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState('');

  const load = () => api.get('/farmer/requests').then((r) => setRows(r.data));

  useEffect(() => {
    load();
  }, []);

  const waitlisted = rows.filter((x) => x.status === 'waitlisted').length;
  const confirmed = rows.filter((x) => x.status === 'confirmed').length;

  const cancel = async (id) => {
    setBusyId(id);
    try {
      await api.patch(`/farmer/requests/${id}/cancel`);
      await load();
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="page">
      <div className="pagehead">
        <div>
          <span className="badge">Farmer</span>
          <h1>Namaste, {currentUser?.name}</h1>
          <p>Book your pickup ticket here. Crop submission happens physically at the hub using that ticket number.</p>
        </div>
        <Link to="/farmer/sell" className="btn-primary">
          <Plus className="inline w-4" /> Sell a Crop
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Stat t="Total Tickets" v={rows.length} />
        <Stat t="Waitlisted" v={waitlisted} />
        <Stat t="Confirmed" v={confirmed} />
      </div>

      <div className="card">
        <div className="flex justify-between mb-4">
          <h2 className="font-bold text-lg">Your Tickets</h2>
          <Link className="text-primary" to="/farmer/notifications">
            Updates <ArrowRight className="inline w-4" />
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="text-gray-500">You haven't booked any pickup tickets yet.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r._id}
                className="border rounded-xl p-4 flex flex-col md:flex-row md:justify-between gap-3"
              >
                <div>
                  <b>{r.cropType}</b>
                  <p className="text-sm text-gray-500">
                    {r.quantity} {r.quantityUnit} · {r.location}
                  </p>
                  {r.timeSlot && (
                    <p className="text-sm text-gray-500">
                      <Clock className="inline w-4" /> {r.timeSlot}
                    </p>
                  )}
                  {r.status === 'received' && r.receivedAt && (
                    <p className="text-sm text-emerald-700">Crop physically received at the hub · {new Date(r.receivedAt).toLocaleString('en-IN')}</p>
                  )}
                  {!!r.fare && (
                    <p className="text-sm text-gray-500">
                      <IndianRupee className="inline w-4" /> Fare ₹{r.fare}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`badge ${STATUS_STYLE[r.status] || ''}`}>
                    {STATUS_LABEL[r.status] || r.status}
                  </span>
                  {r.tokenNumber && (
                    <p className="font-mono font-bold text-primary mt-1">{r.tokenNumber}</p>
                  )}
                  {(r.status === 'confirmed' || r.status === 'waitlisted') && (
                    <button
                      disabled={busyId === r._id}
                      onClick={() => cancel(r._id)}
                      className="text-xs text-red-700 border border-red-200 rounded-lg px-3 py-1 mt-2"
                    >
                      {busyId === r._id ? 'Cancelling…' : 'Cancel Ticket'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ t, v }) {
  return (
    <div className="card">
      <small>{t}</small>
      <div className="text-3xl font-extrabold mt-1">{v}</div>
    </div>
  );
}
