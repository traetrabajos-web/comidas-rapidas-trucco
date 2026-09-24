import { StrictMode, useState, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Carga diferida de las páginas de admin
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'))
const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx'))

const SESSION_KEY = 'trucco_admin_session';

function AdminRouter() {
  const [authed, setAuthed] = useState(
    sessionStorage.getItem(SESSION_KEY) === 'true'
  );

  const handleLogin = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setAuthed(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('trucco_admin_user');
    setAuthed(false);
  };

  if (!authed) return <AdminLogin onLogin={handleLogin} />;
  return <AdminPanel onLogout={handleLogout} />;
}

function RootApp() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <AdminRouter />
      </Suspense>
    );
  }

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
