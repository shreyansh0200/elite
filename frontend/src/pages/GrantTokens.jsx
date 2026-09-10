import { Navigate } from 'react-router-dom';

// The "Grant Tokens" page now lives inside the Hub Manager dashboard.
export default function GrantTokens() {
  return <Navigate to="/hub/dashboard" replace />;
}
