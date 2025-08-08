import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './styles/globals.css';
import './index.css';
import { PayerDashboard } from './pages/PayerDashboard';
import { PayeeDashboard } from './pages/PayeeDashboard';
import { ArbiterDashboard } from './pages/ArbiterDashboard';

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/payer', label: 'Payer', role: 'payer' },
    { path: '/payee', label: 'Payee', role: 'payee' },
    { path: '/arbiter', label: 'Arbiter', role: 'arbiter' }
  ];

  return (
    <div className="w-64 bg-background border-r border-border h-screen p-6">
      <div className="mb-8">
        <h1 className="text-lg font-medium">Web3 Agreements</h1>
        <p className="text-sm text-muted-foreground mt-1">Decentralized Conditional Escrow</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
          >
            {item.label} Dashboard
          </Link>
        ))}
      </nav>
    </div>
  );
}

function AppContent() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<PayerDashboard />} />
          <Route path="/payer" element={<PayerDashboard />} />
          <Route path="/payee" element={<PayeeDashboard />} />
          <Route path="/arbiter" element={<ArbiterDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}