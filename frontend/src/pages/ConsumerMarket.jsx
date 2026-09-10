import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ConsumerMarket() {
  const { currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');

  const load = () => api.get('/market', { params: { q } }).then((r) => setRows(r.data));
  useEffect(() => { load(); }, [q]);

  const buy = async () => {
    try {
      await api.post('/buy', { listingId: selected._id, quantity: Number(qty) });
      setMsg(`Request sent to the ${selected.city || 'listing'} hub manager.`);
      setSelected(null);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Please log in as a customer first.');
    }
  };

  return (
    <div className="page">
      <div className="pagehead"><div><span className="badge">Marketplace</span><h1>Fresh Crops for Sale</h1><p>Buy directly, picked up from the correct city hub.</p></div><input className="input-field max-w-sm" placeholder="Search crop, farmer, city" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {msg && <div className="card bg-emerald-50 mb-4">{msg}</div>}
      {!currentUser && <div className="card mb-4">Log in as a customer to buy. <Link className="text-primary font-bold" to="/login?role=customer">Login</Link></div>}
      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((r) => (
          <div className="card" key={r._id}>
            <h3 className="font-bold text-xl">{r.cropType}</h3><p className="text-gray-500">{r.description}</p>
            <div className="grid grid-cols-2 gap-2 mt-4 text-sm"><div>Available<br /><b>{r.availableQuantity} {r.quantityUnit}</b></div><div>Price<br /><b>₹{Number(r.pricePerUnit || 0).toLocaleString('en-IN')} / {r.quantityUnit}</b></div><div>Farmer<br /><b>{r.farmerName || 'Hub Stock'}</b></div><div>Hub City<br /><b>{r.city || '—'}</b></div><div className="col-span-2">Pickup<br /><b>{r.location}</b></div></div>
            <button disabled={!currentUser || currentUser.role !== 'customer'} onClick={() => { setSelected(r); setQty(1); }} className="btn-secondary w-full mt-5">Buy This</button>
          </div>
        ))}
      </div>
      {selected && <div className="modal"><div className="card max-w-sm w-full"><h3 className="text-xl font-bold">Buy {selected.cropType}</h3><p className="text-sm text-gray-500 mt-1 mb-2">Request will go to <b>{selected.city}</b> hub.</p><input type="number" min="1" max={selected.availableQuantity} className="input-field my-4" value={qty} onChange={(e) => setQty(e.target.value)} /><div className="flex gap-2"><button className="btn-primary flex-1" onClick={buy}>Confirm</button><button className="flex-1 border rounded-lg" onClick={() => setSelected(null)}>Cancel</button></div></div></div>}
    </div>
  );
}
