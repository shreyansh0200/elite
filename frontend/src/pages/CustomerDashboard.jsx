import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, Ticket } from 'lucide-react';
import api from '../services/api';

export default function CustomerDashboard() {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('tickets');

  const load = () => api.get('/buy/mine').then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const tickets = useMemo(() => rows.filter((r) => r.buyerToken), [rows]);
  const activeTickets = tickets.filter((r) => r.status === 'granted').length;

  return (
    <div className="page">
      <div className="pagehead">
        <div>
          <span className="badge">Customer</span>
          <h1>My Customer Dashboard</h1>
          <p>Track purchases and manage your receiver tickets.</p>
        </div>
        <Link className="btn-secondary" to="/consumer">
          Browse Marketplace
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <button className={tab === 'tickets' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('tickets')}>
          Receiver Tickets ({activeTickets})
        </button>
        <button className={tab === 'purchases' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('purchases')}>
          My Purchases ({rows.length})
        </button>
      </div>

      {tab === 'tickets' && (
        <div className="space-y-4">
          <div className="card bg-emerald-50 border border-emerald-100">
            <div className="flex items-start gap-3">
              <Ticket className="w-6 h-6 text-primary mt-1" />
              <div>
                <h2 className="font-bold">Receiver Ticket System</h2>
                <p className="text-sm text-gray-600 mt-1">After the hub manager approves a purchase, your receiver token appears here. Show this token physically at the correct hub for matching.</p>
              </div>
            </div>
          </div>

          {tickets.map((r) => (
            <div className="card border-2 border-emerald-100" key={r._id}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge bg-emerald-100 text-emerald-800">RECEIVER TICKET</span>
                    <span className="text-sm text-gray-500">{r.status}</span>
                  </div>
                  <h3 className="font-bold text-xl">{r.cropType}</h3>
                  <p className="text-gray-600">{r.quantity} {r.quantityUnit} · ₹{Number(r.estimatedValue || 0).toLocaleString('en-IN')}</p>
                  <p className="text-sm text-gray-500 mt-2">Hub: {r.city || '—'} · Pickup: {r.pickupLocation || '—'}</p>
                  <p className="text-sm text-gray-500">Slot: {r.timeSlot || 'Assigned by hub'}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Receiver Token</p>
                  <p className="font-mono font-extrabold text-2xl text-primary mt-1">{r.buyerToken}</p>
                  <div className="flex items-center gap-1 md:justify-end text-sm mt-2">
                    {r.status === 'completed' ? <><CheckCircle2 className="w-4 text-primary" /> Physically matched</> : <><Clock3 className="w-4" /> Awaiting physical matching</>}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!tickets.length && <div className="card text-gray-500">No receiver tickets yet. Submit a purchase request from the marketplace and the ticket will appear after hub approval.</div>}
        </div>
      )}

      {tab === 'purchases' && (
        <div className="space-y-3">
          {rows.map((r) => (
            <div className="card" key={r._id}>
              <div className="flex justify-between gap-3">
                <div><b>{r.cropType}</b><p>{r.quantity} {r.quantityUnit} · ₹{Number(r.estimatedValue || 0).toLocaleString('en-IN')}</p></div>
                <span className="badge">{r.status}</span>
              </div>
              {r.buyerToken && <p className="font-mono text-primary font-bold mt-2">Receiver Token: {r.buyerToken} · {r.timeSlot}</p>}
            </div>
          ))}
          {!rows.length && <div className="card text-gray-500">No purchases yet.</div>}
        </div>
      )}
    </div>
  );
}
