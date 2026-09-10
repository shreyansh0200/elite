import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Register() {
  const [sp] = useSearchParams();
  const initialRole = sp.get('role') === 'customer' ? 'customer' : 'farmer';
  const [role, setRole] = useState(initialRole);
  const [hubCities, setHubCities] = useState([]);
  const [f, setF] = useState({ name: '', phone: '', email: '', location: '', city: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    api.get('/auth/hubs')
      .then((res) => setHubCities(res.data || []))
      .catch(() => setHubCities([]));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (f.password.length < 6) return setError('Password must be at least 6 characters.');
    if (f.password !== f.confirm) return setError('Passwords do not match.');
    if (role === 'farmer' && !f.city) return setError('Select your city so AgriSync can route you to the correct hub.');
    if (role === 'customer' && !f.phone.trim() && !f.email.trim()) return setError('Customer needs a phone number or email.');
    setBusy(true);
    try {
      await register({ name: f.name, phone: f.phone, email: f.email, location: f.location, city: f.city, password: f.password, role });
      nav(role === 'farmer' ? '/farmer/dashboard' : '/customer/dashboard', { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="card max-w-md w-full">
        <h2 className="text-2xl font-bold text-center">Create an Account</h2>

        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg my-5">
          <button type="button" onClick={() => { setRole('farmer'); setError(''); }} className={`py-2 rounded ${role === 'farmer' ? 'bg-white shadow text-primary font-bold' : ''}`}>Farmer</button>
          <button type="button" onClick={() => { setRole('customer'); setError(''); }} className={`py-2 rounded ${role === 'customer' ? 'bg-white shadow text-primary font-bold' : ''}`}>Customer</button>
        </div>

        {error && <div className="error mb-4">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <Input label="Full Name" v={f.name} set={(v) => setF({ ...f, name: v })} />
          <Input label={role === 'farmer' ? 'Phone Number' : 'Phone Number (optional)'} v={f.phone} set={(v) => setF({ ...f, phone: v })} required={role === 'farmer'} inputMode="numeric" />
          {role === 'customer' && <Input label="Email (optional)" type="email" v={f.email} set={(v) => setF({ ...f, email: v })} required={false} />}

          {role === 'farmer' && (
            <label className="block text-sm font-medium">
              City / Hub
              <select
                required
                className="input-field mt-1"
                value={f.city}
                onChange={(e) => setF({ ...f, city: e.target.value })}
              >
                <option value="">Select your hub city</option>
                {hubCities.map((hub) => <option key={hub.city} value={hub.city}>{hub.city}</option>)}
              </select>
              <span className="text-xs text-gray-500 mt-1 block">Your farmer requests will be routed only to this city's hub manager.</span>
            </label>
          )}

          <Input label="Village / Location" v={f.location} set={(v) => setF({ ...f, location: v })} />
          <Input label="Password" type="password" v={f.password} set={(v) => setF({ ...f, password: v })} minLength={6} />
          <Input label="Confirm Password" type="password" v={f.confirm} set={(v) => setF({ ...f, confirm: v })} minLength={6} />
          <button disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? 'Creating account…' : `Create ${role === 'farmer' ? 'Farmer' : 'Customer'} Account`}</button>
        </form>

        <p className="text-center text-sm mt-5">Already have an account? <Link to={`/login?role=${role}`} className="text-primary font-bold">Login</Link></p>
      </div>
    </div>
  );
}

function Input({ label, v, set, type = 'text', required = true, inputMode, minLength }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input required={required} minLength={minLength} type={type} inputMode={inputMode} autoCapitalize="none" className="input-field mt-1" value={v} onChange={(e) => set(e.target.value)} />
    </label>
  );
}
