import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import AuthPage from './components/AuthPage.jsx';
import Workspace from './components/Workspace.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);

  const onAuth = ({ token, user }) => {
    setToken(token);
    setUser(user);
  };
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  if (checking) return <div className="boot">Loading…</div>;
  return user ? <Workspace user={user} onLogout={logout} /> : <AuthPage onAuth={onAuth} />;
}
