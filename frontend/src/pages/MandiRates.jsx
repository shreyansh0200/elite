import { useEffect, useState } from 'react';
import { Search, RefreshCw, MapPin, IndianRupee } from 'lucide-react';
import api from '../services/api';

export default function MandiRates() {
  const [state, setState] = useState('Uttar Pradesh');
  const [crop, setCrop] = useState('');
  const [market, setMarket] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('');
  const [warning, setWarning] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/mandi/prices', {
        params: { state, commodity: crop, market, limit: 50 },
      });
      setRows(r.data.records || []);
      setSource(r.data.source || '');
      setWarning(r.data.warning || '');
    } catch (e) {
      setRows([]);
      setSource('');
      setWarning(e.response?.data?.message || 'Could not load mandi data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page">
      <div className="pagehead">
        <div>
          <span className="badge">Today's Crop Prices</span>
          <h1>Mandi Prices</h1>
          <p>Search your crop and market to see the going rate.</p>
        </div>
        <button className="btn-secondary" onClick={load}>
          <RefreshCw className="inline w-4" /> Refresh
        </button>
      </div>

      <div className="card grid md:grid-cols-4 gap-3 mb-6">
        <input
          className="input-field"
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="State"
        />
        <input
          className="input-field"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          placeholder="Crop (e.g. Wheat)"
        />
        <input
          className="input-field"
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          placeholder="Market / Mandi"
        />
        <button className="btn-primary" onClick={load}>
          <Search className="inline w-4" /> Search
        </button>
      </div>

      {source && (
        <p className="text-xs text-gray-500 mb-2">
          Source: {source === 'data.gov.in' ? 'Government data (data.gov.in)' : 'Sample prices (demo)'}
          {source === 'data.gov.in' && ' · live government data'}
        </p>
      )}
      {warning && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {warning}
        </div>
      )}

      {loading ? (
        <div className="card">Loading prices…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((r, i) => (
            <div className="card" key={i}>
              <div className="flex justify-between">
                <h3 className="font-bold text-lg">{r.commodity}</h3>
                <span className="badge">{r.arrival_date || 'Latest'}</span>
              </div>
              <p className="text-gray-500 flex gap-1 items-center">
                <MapPin className="w-4" />
                {r.market}, {r.district || r.state}
              </p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Stat t="Lowest" v={r.min_price} />
                <Stat t="Usual" v={r.modal_price} />
                <Stat t="Highest" v={r.max_price} />
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="card md:col-span-2 text-center text-gray-500">
              No prices found. Try a different crop or market.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ t, v }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <small>{t}</small>
      <div className="font-bold mt-1">
        <IndianRupee className="inline w-4" />
        {Number(v || 0).toLocaleString('en-IN')}
      </div>
    </div>
  );
}
