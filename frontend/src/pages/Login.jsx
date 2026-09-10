import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ROLES = [
  ['farmer', 'Farmer'],
  ['hubmanager', 'Hub Manager'],
  ['customer', 'Customer'],
];

const validRole = (value) => ROLES.some(([role]) => role === value) ? value : 'farmer';

export default function Login() {
  const [sp] = useSearchParams();
  const [role, setRole] = useState(validRole(sp.get('role')));
  const [form, setForm] = useState({ phone: '', email: '', username: '', password: '' });
  const [hubCities, setHubCities] = useState([]);
  const [showDemo, setShowDemo] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    api.get('/auth/hubs').then((res) => setHubCities(res.data || [])).catch(() => setHubCities([]));
  }, []);

  const updateRole = (nextRole) => {
    setRole(nextRole);
    setError('');
    setForm((current) => ({ ...current, password: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const credentials = {
        role,
        password: form.password,
        ...(role === 'farmer' ? { phone: form.phone } : {}),
        ...(role === 'hubmanager' ? { username: form.username } : {}),
        ...(role === 'customer' ? { phone: form.phone, email: form.email } : {}),
      };
      const result = await login(credentials);
      nav(result.user.role === 'farmer' ? '/farmer/dashboard' : result.user.role === 'hubmanager' ? '/hub/dashboard' : '/customer/dashboard', { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Could not log in. Please check your details.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="card max-w-md w-full">
        <h2 className="text-2xl font-bold text-center">Welcome Back</h2>
        <p className="text-center text-gray-500 mb-6">Choose how you use AgriSync</p>

        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg mb-5">
          {ROLES.map(([value, label]) => (
            <button type="button" key={value} onClick={() => updateRole(value)} className={`py-2 rounded ${role === value ? 'bg-white shadow text-primary font-bold' : ''}`}>
              {label}
            </button>
          ))}
        </div>

        {error && <div className="error mb-4">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          {role === 'farmer' && <Input label="Phone Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />}
          {role === 'hubmanager' && (
            <>
              <Input label="Hub Manager Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} autoCapitalize="none" />
              <p className="text-xs text-gray-500">Each username belongs to exactly one city hub. You only see that hub's requests, slots and stocks.</p>
            </>
          )}
          {role === 'customer' && (
            <>
              <Input label="Phone Number " value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required={false} inputMode="numeric" />
              <Input label="Email (optional)" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required={false} autoCapitalize="none" />
              <p className="text-xs text-gray-500">Enter at least one: phone number or email.</p>
            </>
          )}
          <Input label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
          <button disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? 'Logging in…' : 'Login'}</button>
        </form>

        {role === 'hubmanager' && (
          <div className="mt-5 border rounded-xl p-3 bg-gray-50">
            <button type="button" className="font-bold text-sm" onClick={() => setShowDemo(!showDemo)}>
              {showDemo ? 'Hide' : 'Show'} 10 demo hub credentials
            </button>
            {showDemo && (
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto text-xs">
                {hubCities.map((hub) => (
                  <div key={hub.city} className="bg-white border rounded-lg p-2 flex justify-between gap-3">
                    <div><b>{hub.city}</b><div>{hub.name}</div></div>
                    <code>{hub.city === 'Kanpur' ? 'hub_kanpur / Kanpur@123' : hub.city === 'Lucknow' ? 'hub_lucknow / Lucknow@123' : hub.city === 'Prayagraj' ? 'hub_prayagraj / Prayagraj@123' : hub.city === 'Varanasi' ? 'hub_varanasi / Varanasi@123' : hub.city === 'Agra' ? 'hub_agra / Agra@123' : hub.city === 'Meerut' ? 'hub_meerut / Meerut@123' : hub.city === 'Gorakhpur' ? 'hub_gorakhpur / Gorakhpur@123' : hub.city === 'Bareilly' ? 'hub_bareilly / Bareilly@123' : hub.city === 'Jhansi' ? 'hub_jhansi / Jhansi@123' : 'hub_aligarh / Aligarh@123'}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {role !== 'hubmanager' && (
          <p className="text-center text-sm mt-5">
            New here? <Link className="text-primary font-bold" to={`/register?role=${role}`}>Create an account</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required = true, inputMode, autoCapitalize = 'none' }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input required={required} type={type} inputMode={inputMode} autoCapitalize={autoCapitalize} className="input-field mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
