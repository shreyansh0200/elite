import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Upload, Check, Clock, IndianRupee } from 'lucide-react';
import api from '../services/api';

// Mirrors backend/utils/fare.js — ₹100 per 36 quintal (or part thereof).
const FARE_PER_BLOCK = 100;
const BLOCK_QUINTAL = 36;
const UNIT_TO_QUINTAL = { Quintal: 1, Kg: 0.01, Ton: 10 };

function toQuintal(qty, unit) {
  const n = Number(qty) || 0;
  return n * (UNIT_TO_QUINTAL[unit] ?? 1);
}

function computeFare(quintal) {
  if (quintal <= 0) return 0;
  return Math.ceil(quintal / BLOCK_QUINTAL) * FARE_PER_BLOCK;
}

export default function SellGoods() {
  const nav = useNavigate();
  const [f, setF] = useState({
    cropType: '',
    quantity: '',
    quantityUnit: 'Quintal',
    expectedPrice: '',
    location: '',
    notes: '',
  });
  const [photo, setPhoto] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    api.get('/farmer/slots').then((r) => setSlots(r.data));
  }, []);

  const quintalEquivalent = useMemo(
    () => toQuintal(f.quantity, f.quantityUnit),
    [f.quantity, f.quantityUnit],
  );
  const fare = useMemo(() => computeFare(quintalEquivalent), [quintalEquivalent]);

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition((p) =>
      setF({ ...f, location: `${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}` }),
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!slotId) {
      setError('Choose a pickup slot to book your ticket.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const d = new FormData();
      Object.entries(f).forEach(([k, v]) => d.append(k, v));
      d.append('slotId', slotId);
      if (photo) d.append('photo', photo);
      const res = await api.post('/farmer/book', d, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTicket(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not book your ticket. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (ticket) {
    const confirmed = ticket.status === 'confirmed';
    return (
      <div className="auth">
        <div className="card max-w-lg w-full text-center">
          <div
            className={`w-14 h-14 rounded-full grid place-items-center mx-auto mb-4 ${
              confirmed ? 'bg-emerald-100 text-primary' : 'bg-amber-100 text-amber-700'
            }`}
          >
            <Check />
          </div>
          <h1 className="text-2xl font-bold">{confirmed ? 'Ticket Confirmed!' : "You're Waitlisted"}</h1>
          <p className="text-gray-500 mb-4">
            {confirmed
              ? 'Your ticket is confirmed. Bring your produce physically to this hub at the slot below and show this ticket number to the hub manager.'
              : "The slot is full for now — we'll auto-confirm you if a spot opens up."}
          </p>

          <div className="border rounded-xl p-4 text-left space-y-1">
            <p>
              PNR / Ticket No. <span className="font-mono font-bold text-primary">{ticket.tokenNumber}</span>
            </p>
            <p>
              Status{' '}
              <span className={`badge ${confirmed ? '' : 'bg-amber-100 text-amber-800'}`}>
                {confirmed ? 'CONFIRMED' : ticket.tokenNumber}
              </span>
            </p>
            <p>
              <Clock className="inline w-4 mr-1" /> {ticket.timeSlot}
            </p>
            <p>
              <IndianRupee className="inline w-4 mr-1" /> Ticket fare: ₹{ticket.fare}
            </p>
            <p>
              {ticket.cropType} · {ticket.quantity} {ticket.quantityUnit}
            </p>
            {confirmed && <p className="text-sm text-emerald-700 mt-2">Crop submission status: <b>NOT YET RECEIVED</b> — submit physically at the hub.</p>}
          </div>

          <button className="btn-primary w-full mt-5" onClick={() => nav('/farmer/dashboard')}>
            Go to My Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="card max-w-2xl w-full">
        <h1 className="text-2xl font-bold">Sell Your Crop</h1>
        <p className="text-gray-500 mb-6">
          Book a hub pickup slot yourself — like booking a train ticket. Fare is ₹{FARE_PER_BLOCK} per{' '}
          {BLOCK_QUINTAL} quintal.
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
          <Input l="Crop Name" v={f.cropType} s={(v) => setF({ ...f, cropType: v })} />
          <Input
            l="Quantity"
            type="number"
            v={f.quantity}
            s={(v) => setF({ ...f, quantity: v })}
          />

          <label>
            Unit
            <select
              className="input-field mt-1"
              value={f.quantityUnit}
              onChange={(e) => setF({ ...f, quantityUnit: e.target.value })}
            >
              <option>Quintal</option>
              <option>Kg</option>
              <option>Ton</option>
            </select>
          </label>

          <Input
            l="Your Price (per unit)"
            type="number"
            v={f.expectedPrice}
            s={(v) => setF({ ...f, expectedPrice: v })}
          />

          <label className="md:col-span-2">
            Pickup Location
            <div className="flex gap-2">
              <input
                required
                className="input-field mt-1"
                value={f.location}
                onChange={(e) => setF({ ...f, location: e.target.value })}
              />
              <button
                type="button"
                onClick={useMyLocation}
                className="px-3 bg-gray-100 rounded-lg mt-1"
                title="Use my current location"
              >
                <MapPin />
              </button>
            </div>
          </label>

          <label className="md:col-span-2">
            Notes (optional)
            <textarea
              className="input-field mt-1"
              rows="3"
              value={f.notes}
              onChange={(e) => setF({ ...f, notes: e.target.value })}
            />
          </label>

          <label className="md:col-span-2 border-2 border-dashed rounded-xl p-5">
            <Upload className="inline mr-2" />
            Add a Photo (optional)
            <input
              type="file"
              accept="image/*"
              className="block mt-2"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
          </label>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <b>Choose a Pickup Slot</b>
              {quintalEquivalent > 0 && (
                <span className="text-sm text-gray-500">
                  Fare for {f.quantity} {f.quantityUnit}: <b className="text-primary">₹{fare}</b>
                </span>
              )}
            </div>

            {slots.length === 0 && (
              <p className="text-gray-500 text-sm border rounded-xl p-4">
                No pickup slots are open right now. Please check back soon.
              </p>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {slots.map((s) => {
                const willFit = quintalEquivalent > 0 && quintalEquivalent <= s.availableQuintal;
                const full = s.availableQuintal <= 0;
                return (
                  <label
                    key={s._id}
                    className={`flex items-center justify-between border rounded-xl p-3 cursor-pointer ${
                      slotId === s._id ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="slot"
                        checked={slotId === s._id}
                        onChange={() => setSlotId(s._id)}
                      />
                      <div>
                        <p className="font-semibold">
                          {s.date} · {s.startTime} - {s.endTime}
                        </p>
                        {s.location && <p className="text-xs text-gray-500">{s.location}</p>}
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${full ? 'text-red-600' : 'text-emerald-700'}`}>
                      {full ? 'FULL — waitlist only' : `${s.availableQuintal} qtl available`}
                      {!full && quintalEquivalent > 0 && !willFit && ' — you will be waitlisted'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <button disabled={busy} className="btn-primary md:col-span-2">
            {busy ? 'Booking…' : 'Book Pickup Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Input({ l, v, s, type = 'text' }) {
  return (
    <label>
      {l}
      <input required className="input-field mt-1" type={type} value={v} onChange={(e) => s(e.target.value)} />
    </label>
  );
}
