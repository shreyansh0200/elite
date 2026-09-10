import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Package, ClipboardList, Warehouse, MapPin, Search, CheckCircle2, TicketCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const STATUS_STYLE = {
  confirmed: 'bg-emerald-100 text-emerald-800',
  waitlisted: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-200 text-gray-700',
  received: 'bg-emerald-100 text-emerald-800',
};

export default function HubManagerDashboard() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('overview');
  const [tickets, setTickets] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [buyerSlot, setBuyerSlot] = useState('12:00 PM - 01:00 PM');
  const [ticketNumber, setTicketNumber] = useState('');
  const [physicalTicket, setPhysicalTicket] = useState(null);
  const [receiverToken, setReceiverToken] = useState('');
  const [matchedReceiver, setMatchedReceiver] = useState(null);
  const [received, setReceived] = useState({ quantity: '', unit: 'Quintal', qualityGrade: '', notes: '' });
  const [submissionBusy, setSubmissionBusy] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '', capacityQuintal: '', location: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [a, b, c, d] = await Promise.all([
        api.get('/farmer/manager/requests'),
        api.get('/buy/manager'),
        api.get('/farmer/slots/manager'),
        api.get('/farmer/manager/stocks'),
      ]);
      setTickets(a.data);
      setBuyers(b.data);
      setSlots(c.data);
      setStocks(d.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load hub data.');
    }
  };

  useEffect(() => { load(); }, []);

  const rejectTicket = async (id) => {
    try { await api.patch(`/farmer/manager/requests/${id}/reject`); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Could not cancel the ticket.'); }
  };

  const actBuyer = async (id, approved) => {
    try { await api.patch(`/buy/${id}/${approved ? 'grant' : 'reject'}`, approved ? { timeSlot: buyerSlot } : {}); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Could not update the buy request.'); }
  };

  const createSlot = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/farmer/slots', {
        ...newSlot,
        capacityQuintal: Number(newSlot.capacityQuintal),
      });
      setNewSlot({ date: '', startTime: '', endTime: '', capacityQuintal: '', location: '' });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not create the slot.');
    } finally {
      setBusy(false);
    }
  };

  const closeSlot = async (id) => {
    try { await api.patch(`/farmer/slots/${id}/close`); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Could not close the slot.'); }
  };

  const findPhysicalTicket = async (e) => {
    e?.preventDefault();
    setError('');
    setPhysicalTicket(null);
    const number = ticketNumber.trim();
    if (!number) {
      setError('Enter the farmer ticket number shown on the ticket.');
      return;
    }
    setSubmissionBusy(true);
    try {
      const res = await api.get('/farmer/manager/physical-submission', { params: { ticketNumber: number } });
      setPhysicalTicket(res.data);
      setReceived({
        quantity: String(res.data.bookedQuantity ?? ''),
        unit: res.data.bookedQuantityUnit || 'Quintal',
        qualityGrade: '',
        notes: '',
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Could not find that ticket.');
    } finally {
      setSubmissionBusy(false);
    }
  };

  const findReceiverToken = async (e) => {
    e?.preventDefault();
    setError('');
    setMatchedReceiver(null);
    const token = receiverToken.trim();
    if (!token) {
      setError('Enter the customer receiver token.');
      return;
    }
    setSubmissionBusy(true);
    try {
      const res = await api.get('/buy/manager/receiver-token', { params: { buyerToken: token } });
      setMatchedReceiver(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not find that receiver token.');
    } finally {
      setSubmissionBusy(false);
    }
  };

  const matchReceiverToken = async (e) => {
    e.preventDefault();
    if (!matchedReceiver) return;
    setError('');
    setSubmissionBusy(true);
    try {
      const res = await api.post('/buy/manager/receiver-token', { buyerToken: matchedReceiver.buyerToken });
      setMatchedReceiver(null);
      setReceiverToken('');
      window.alert(res.data.message);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not match the receiver token.');
    } finally {
      setSubmissionBusy(false);
    }
  };

  const receivePhysicalCrop = async (e) => {
    e.preventDefault();
    if (!physicalTicket) return;
    setError('');
    setSubmissionBusy(true);
    try {
      const res = await api.post('/farmer/manager/physical-submission', {
        ticketNumber: physicalTicket.tokenNumber,
        receivedQuantity: Number(received.quantity),
        receivedQuantityUnit: received.unit,
        qualityGrade: received.qualityGrade,
        submissionNotes: received.notes,
      });
      setPhysicalTicket(null);
      setTicketNumber('');
      setReceived({ quantity: '', unit: 'Quintal', qualityGrade: '', notes: '' });
      window.alert(res.data.message);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not record the physical crop submission.');
    } finally {
      setSubmissionBusy(false);
    }
  };

  const stockTotals = useMemo(() => stocks.reduce((acc, s) => {
    acc.total += Number(s.totalQuantity || 0);
    acc.available += Number(s.availableQuantity || 0);
    acc.sold += Number(s.soldQuantity || 0);
    return acc;
  }, { total: 0, available: 0, sold: 0 }), [stocks]);

  const pendingBuyers = buyers.filter((x) => x.status === 'pending').length;
  const activeTickets = tickets.filter((x) => x.status === 'confirmed' || x.status === 'waitlisted').length;

  return (
    <div className="page">
      <div className="pagehead">
        <div>
          <span className="badge">Hub Manager</span>
          <h1>{currentUser?.city || 'City'} Hub Dashboard</h1>
          <p className="flex items-center gap-1"><MapPin className="w-4" /> {currentUser?.city || 'City'} hub · only this hub's operational data is shown</p>
        </div>
      </div>

      {error && <div className="error mb-4">{error}</div>}

      <div className="grid md:grid-cols-4 gap-3 mb-5">
        <Summary icon={<Warehouse />} label="Available Stock" value={`${stockTotals.available} qtl`} />
        <Summary icon={<Package />} label="Total Stock" value={`${stockTotals.total} qtl`} />
        <Summary icon={<ClipboardList />} label="Farmer Tickets" value={activeTickets} />
        <Summary icon={<Package />} label="Pending Buy Requests" value={pendingBuyers} />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <Tab active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</Tab>
        <Tab active={tab === 'stocks'} onClick={() => setTab('stocks')}>Stocks ({stocks.length})</Tab>
        <Tab active={tab === 'slots'} onClick={() => setTab('slots')}>Pickup Slots ({slots.filter((s) => s.status === 'open').length} open)</Tab>
        <Tab active={tab === 'tickets'} onClick={() => setTab('tickets')}>Farmer Tickets ({activeTickets})</Tab>
        <Tab active={tab === 'receive'} onClick={() => setTab('receive')}>Receive Crop</Tab>
        <Tab active={tab === 'receiver'} onClick={() => setTab('receiver')}>Match Receiver Token</Tab>
        <Tab active={tab === 'buyer'} onClick={() => setTab('buyer')}>Buy Requests ({pendingBuyers})</Tab>
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="font-bold text-lg mb-3">Hub identity</h2>
            <p><b>Manager:</b> {currentUser?.name}</p>
            <p><b>Username:</b> {currentUser?.username}</p>
            <p><b>City:</b> {currentUser?.city || 'Not configured'}</p>
            <p className="text-sm text-gray-500 mt-3">Farmer bookings and marketplace purchase approvals for other cities are not visible or actionable from this account.</p>
          </div>
          <div className="card">
            <h2 className="font-bold text-lg mb-3">Inventory snapshot</h2>
            {stocks.slice(0, 5).map((s) => (
              <div key={s._id} className="flex justify-between border-b last:border-0 py-2 text-sm">
                <span>{s.cropType}</span><b>{s.availableQuantity} / {s.totalQuantity} {s.quantityUnit}</b>
              </div>
            ))}
            {!stocks.length && <p className="text-gray-500">No stock recorded yet.</p>}
          </div>
        </div>
      )}

      {tab === 'stocks' && (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="font-bold text-lg">Current Hub Stocks</h2><p className="text-sm text-gray-500">Only {currentUser?.city || 'this'} hub inventory.</p></div>
            <b>{stockTotals.available} qtl available</b>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="py-2">Crop</th><th>Farmer</th><th>Total</th><th>Available</th><th>Sold</th><th>Price</th><th>Status</th></tr></thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={s._id} className="border-b last:border-0">
                  <td className="py-3 font-bold">{s.cropType}</td>
                  <td>{s.farmerName || 'Hub Stock'}</td>
                  <td>{s.totalQuantity} {s.quantityUnit}</td>
                  <td className="text-primary font-bold">{s.availableQuantity} {s.quantityUnit}</td>
                  <td>{s.soldQuantity} {s.quantityUnit}</td>
                  <td>₹{Number(s.pricePerUnit || 0).toLocaleString('en-IN')}</td>
                  <td><span className="badge">{s.status.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!stocks.length && <p className="text-gray-500 py-5">No stock records found. Only physically received crop lots appear here (plus seeded demo stock).</p>}
        </div>
      )}

      {tab === 'slots' && (
        <div className="space-y-5">
          <div className="card">
            <h2 className="font-bold text-lg mb-3">Publish a Pickup Slot for {currentUser?.city}</h2>
            <form onSubmit={createSlot} className="grid md:grid-cols-5 gap-3 items-end">
              <label>Date<input required type="date" className="input-field mt-1" value={newSlot.date} onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })} /></label>
              <label>Start Time<input required placeholder="09:00 AM" className="input-field mt-1" value={newSlot.startTime} onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })} /></label>
              <label>End Time<input required placeholder="10:00 AM" className="input-field mt-1" value={newSlot.endTime} onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })} /></label>
              <label>Capacity (Quintal)<input required type="number" min="1" className="input-field mt-1" value={newSlot.capacityQuintal} onChange={(e) => setNewSlot({ ...newSlot, capacityQuintal: e.target.value })} /></label>
              <button disabled={busy} className="btn-primary">{busy ? 'Publishing…' : 'Publish Slot'}</button>
              <label className="md:col-span-5">Location<input className="input-field mt-1" placeholder={`AgriSync Hub, ${currentUser?.city || ''}`} value={newSlot.location} onChange={(e) => setNewSlot({ ...newSlot, location: e.target.value })} /></label>
            </form>
          </div>

          <div className="space-y-3">
            {slots.map((s) => (
              <div className="card" key={s._id}>
                <div className="flex flex-col md:flex-row md:justify-between gap-3">
                  <div><h3 className="font-bold">{s.date} · {s.startTime} - {s.endTime}</h3><p className="text-sm text-gray-500">{s.location}</p><p className="text-sm text-gray-500">{s.bookedQuintal} / {s.capacityQuintal} quintal booked · <b className="text-primary">{s.availableQuintal} available</b></p></div>
                  <div className="text-right"><span className={`badge ${s.status === 'open' ? '' : 'bg-gray-200 text-gray-700'}`}>{s.status.toUpperCase()}</span>{s.status === 'open' && <div><button className="border border-red-200 text-red-700 rounded-lg px-4 py-1 mt-2 text-sm" onClick={() => closeSlot(s._id)}>Close Slot</button></div>}</div>
                </div>
              </div>
            ))}
            {!slots.length && <div className="card text-gray-500">No pickup slots published yet.</div>}
          </div>
        </div>
      )}

      {tab === 'tickets' && (
        <div className="space-y-3">
          {tickets.map((r) => (
            <div className="card" key={r._id}><div className="flex flex-col md:flex-row md:justify-between gap-3"><div><h3 className="font-bold text-lg">{r.farmerName}</h3><p>{r.cropType} · {r.quantity} {r.quantityUnit}</p><p className="text-sm text-gray-500">{r.location}</p>{r.submissionSource === 'hub_manager_physical' && <p className="text-sm text-emerald-700">Physical submission recorded · {r.receivedQuantity} {r.receivedQuantityUnit}</p>}{r.timeSlot && <p className="text-sm text-gray-500">{r.timeSlot}</p>}{!!r.fare && <p className="text-sm text-gray-500">Fare ₹{r.fare}</p>}</div><div className="text-right"><span className={`badge ${STATUS_STYLE[r.status] || ''}`}>{r.status.toUpperCase()}</span>{r.tokenNumber && <p className="font-mono text-primary font-bold">{r.tokenNumber}</p>}{r.status === 'received' && <p className="text-xs text-emerald-700 mt-2">Crop physically received</p>}{(r.status === 'confirmed' || r.status === 'waitlisted') && <button className="border border-red-200 text-red-700 rounded-lg px-4 py-1 mt-2 text-sm" onClick={() => rejectTicket(r._id)}>Cancel Ticket</button>}</div></div></div>
          ))}
          {!tickets.length && <div className="card text-gray-500">No farmer tickets for this hub.</div>}
        </div>
      )}

      {tab === 'receive' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary grid place-items-center"><Search /></div>
              <div>
                <h2 className="font-bold text-lg">Physical Crop Receipt</h2>
                <p className="text-sm text-gray-500">The farmer must physically reach <b>{currentUser?.city || 'this'} hub</b> with the confirmed ticket number. Enter the ticket number to verify it. No farmer-side crop submission is created online.</p>
              </div>
            </div>
            <form onSubmit={findPhysicalTicket} className="flex flex-col md:flex-row gap-2">
              <input className="input-field" placeholder="Enter confirmed ticket number / PNR" value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} required />
              <button className="btn-primary md:w-44" disabled={submissionBusy}>{submissionBusy ? 'Checking…' : 'Verify Ticket'}</button>
            </form>
          </div>

          {physicalTicket && (
            <div className="card border-2 border-emerald-200">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                <div>
                  <span className="badge bg-emerald-100 text-emerald-800">TICKET VERIFIED</span>
                  <h3 className="font-bold text-xl mt-2">{physicalTicket.tokenNumber}</h3>
                  <p className="text-gray-600">Farmer: <b>{physicalTicket.farmerName}</b> · {physicalTicket.farmerPhone}</p>
                  <p className="text-gray-600">Crop: <b>{physicalTicket.cropType}</b> · Booked {physicalTicket.bookedQuantity} {physicalTicket.bookedQuantityUnit}</p>
                  <p className="text-sm text-gray-500">{physicalTicket.timeSlot}</p>
                </div>
                <div className="text-right"><CheckCircle2 className="inline w-8 h-8 text-primary" /><p className="text-xs text-gray-500 mt-1">Hub: {physicalTicket.city || currentUser?.city}</p></div>
              </div>
              <form onSubmit={receivePhysicalCrop} className="grid md:grid-cols-2 gap-4">
                <label>Actual Received Quantity<input required type="number" min="0.01" step="0.01" className="input-field mt-1" value={received.quantity} onChange={(e) => setReceived({ ...received, quantity: e.target.value })} /></label>
                <label>Unit<select className="input-field mt-1" value={received.unit} onChange={(e) => setReceived({ ...received, unit: e.target.value })}><option>Quintal</option><option>Kg</option><option>Ton</option></select></label>
                <label>Quality / Grade (optional)<input className="input-field mt-1" placeholder="A, B, Moisture 12%, etc." value={received.qualityGrade} onChange={(e) => setReceived({ ...received, qualityGrade: e.target.value })} /></label>
                <label>Submission Notes (optional)<input className="input-field mt-1" placeholder="Physical verification notes" value={received.notes} onChange={(e) => setReceived({ ...received, notes: e.target.value })} /></label>
                <div className="md:col-span-2"><button disabled={submissionBusy} className="btn-primary w-full md:w-auto">{submissionBusy ? 'Recording…' : 'Confirm Physical Receipt & Add to Stock'}</button></div>
              </form>
            </div>
          )}

          <div className="card bg-gray-50">
            <h3 className="font-bold mb-2">Correct operating flow</h3>
            <p className="text-sm text-gray-600">1. Farmer books a ticket online → 2. Farmer brings the ticket and crop physically to the booked hub → 3. Manager verifies the ticket number → 4. Manager records the actual received quantity → 5. Only then the crop appears in hub stock and the marketplace.</p>
          </div>
        </div>
      )}

      {tab === 'receiver' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary grid place-items-center"><TicketCheck /></div>
              <div>
                <h2 className="font-bold text-lg">Physical Matching of Receiver Token</h2>
                <p className="text-sm text-gray-500">When a customer physically arrives at this hub, enter the receiver token from the customer ticket. Verify the customer's details and then mark the pickup as physically matched.</p>
              </div>
            </div>
            <form onSubmit={findReceiverToken} className="flex flex-col md:flex-row gap-2">
              <input className="input-field" placeholder="Enter customer receiver token" value={receiverToken} onChange={(e) => setReceiverToken(e.target.value)} required />
              <button className="btn-primary md:w-44" disabled={submissionBusy}>{submissionBusy ? 'Checking…' : 'Find Receiver'}</button>
            </form>
          </div>

          {matchedReceiver && (
            <div className="card border-2 border-emerald-200">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                <div>
                  <span className="badge bg-emerald-100 text-emerald-800">RECEIVER VERIFIED</span>
                  <h3 className="font-bold text-xl mt-2">{matchedReceiver.buyerToken}</h3>
                  <p className="text-gray-600">Customer: <b>{matchedReceiver.consumerName}</b> · {matchedReceiver.consumerPhone || 'Phone not available'}</p>
                  <p className="text-gray-600">Crop: <b>{matchedReceiver.cropType}</b> · {matchedReceiver.quantity} {matchedReceiver.quantityUnit}</p>
                  <p className="text-sm text-gray-500">Hub: {matchedReceiver.city || currentUser?.city} · Slot: {matchedReceiver.timeSlot || '—'}</p>
                </div>
                <div className="text-right"><CheckCircle2 className="inline w-8 h-8 text-primary" /><p className="text-xs text-gray-500 mt-1">Customer receiver ticket</p></div>
              </div>
              <button disabled={submissionBusy} onClick={matchReceiverToken} className="btn-primary w-full md:w-auto">
                {submissionBusy ? 'Matching…' : 'Confirm Physical Receiver Match'}
              </button>
            </div>
          )}

          <div className="card bg-gray-50">
            <h3 className="font-bold mb-2">Receiver operating flow</h3>
            <p className="text-sm text-gray-600">1. Customer submits a marketplace purchase request → 2. Hub Manager approves it and a receiver token is generated → 3. Customer brings the receiver token physically to the assigned hub → 4. Manager verifies the token and customer details → 5. Manager confirms the physical match and the purchase becomes completed.</p>
          </div>
        </div>
      )}

      {tab === 'buyer' && (
        <div className="space-y-3">
          <select className="input-field max-w-xs mb-2" value={buyerSlot} onChange={(e) => setBuyerSlot(e.target.value)}><option>09:00 AM - 10:00 AM</option><option>10:00 AM - 11:00 AM</option><option>11:00 AM - 12:00 PM</option><option>12:00 PM - 01:00 PM</option><option>02:00 PM - 03:00 PM</option></select>
          {buyers.map((r) => (
            <div className="card" key={r._id}><div className="flex flex-col md:flex-row md:justify-between gap-3"><div><h3 className="font-bold text-lg">{r.consumerName}</h3><p>{r.cropType} · {r.quantity} {r.quantityUnit}</p><p className="text-sm text-gray-500">{r.pickupLocation}</p><p className="text-sm text-gray-500">Hub: {r.city || currentUser?.city}</p></div><div className="text-right"><span className="badge">{r.status}</span>{r.status === 'pending' && <div className="flex gap-2 mt-3"><button className="btn-primary" onClick={() => actBuyer(r._id, true)}>Approve</button><button className="border border-red-200 text-red-700 rounded-lg px-4" onClick={() => actBuyer(r._id, false)}>Reject</button></div>}{r.buyerToken && <p className="font-mono text-primary font-bold">{r.buyerToken}</p>}</div></div></div>
          ))}
          {!buyers.length && <div className="card text-gray-500">No buy requests for this hub.</div>}
        </div>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return <button onClick={onClick} className={active ? 'btn-primary' : 'btn-secondary'}>{children}</button>;
}

function Summary({ icon, label, value }) {
  return <div className="card flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary grid place-items-center">{icon}</div><div><p className="text-xs text-gray-500">{label}</p><b className="text-lg">{value}</b></div></div>;
}
