import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Notifications() {
  const [rows, setRows] = useState([]);

  const load = () => api.get('/notifications').then((r) => setRows(r.data));

  useEffect(() => {
    load();
    api.patch('/notifications/read-all');
  }, []);

  return (
    <div className="page max-w-4xl">
      <h1>Updates</h1>
      <p className="text-gray-500 mb-6">Approvals, rejections and marketplace news.</p>

      {rows.map((n) => (
        <div className="card mb-3" key={n._id}>
          <b>{n.type}</b>
          <p>{n.message}</p>
          <small>{new Date(n.createdAt).toLocaleString()}</small>
        </div>
      ))}

      {!rows.length && <div className="card text-gray-500">No updates yet.</div>}
    </div>
  );
}
