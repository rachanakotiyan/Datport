import { Suspense, lazy } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BackgroundEffects } from './components/shared';

const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const CongestionAnalytics = lazy(() => import('./pages/CongestionAnalytics'));
const AIPredictions = lazy(() => import('./pages/AIPredictions'));
const LaneIntelligence = lazy(() => import('./pages/LaneIntelligence'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const AICityPlanner = lazy(() => import('./pages/AICityPlanner'));
const ScenarioSimulator = lazy(() => import('./pages/ScenarioSimulator'));
const Sustainability = lazy(() => import('./pages/Sustainability'));

const navItems = [
  { path: '/', label: 'Command Center', icon: '🏠' },
  { path: '/congestion', label: 'Congestion Analytics', icon: '🔥' },
  { path: '/predictions', label: 'AI Predictions', icon: '🤖' },
  { path: '/lanes', label: 'Lane Intelligence', icon: '🛣️' },
  { path: '/recommendations', label: 'Recommendations', icon: '📋' },
  { path: '/planner', label: 'AI City Planner', icon: '🧠' },
  { path: '/simulator', label: 'Scenario Simulator', icon: '🎮' },
  { path: '/sustainability', label: 'Sustainability', icon: '🌱' },
];

function LoadingFallback() {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="skeleton" style={{ height: 60, width: '40%' }} />
      <div className="skeleton" style={{ height: 20, width: '55%' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 120 }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginTop: 20 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 300 }} />
        ))}
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();

  return (
    <div className="app-layout">
      <BackgroundEffects />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>UrbanFlow AI</h1>
          <p>Traffic Intelligence</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-badge">
            <span className="status-dot" />
            <span>System Online — All Services Active</span>
          </div>
          <p className="sidebar-version">UrbanFlow AI v3.2.1 • Build 2026.06</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<CommandCenter />} />
              <Route path="/congestion" element={<CongestionAnalytics />} />
              <Route path="/predictions" element={<AIPredictions />} />
              <Route path="/lanes" element={<LaneIntelligence />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/planner" element={<AICityPlanner />} />
              <Route path="/simulator" element={<ScenarioSimulator />} />
              <Route path="/sustainability" element={<Sustainability />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
