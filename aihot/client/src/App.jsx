import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TopicDetail from './pages/TopicDetail';
import Trends from './pages/Trends';
import Settings from './pages/Settings';
import AgentChat from './pages/AgentChat';
import { useNotifications } from './hooks/useNotifications';

const API = '/api/hotspots';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasNew, setHasNew] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const fetchHotspots = useCallback(async () => {
    try {
      const res = await fetch(`${API}?limit=50`);
      const json = await res.json();
      setHotspots(json.data || []);
      setHasNew(json.hasNew);
      setNewCount(json.newCount);
    } catch (e) {
      console.error('Failed to fetch hotspots:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHotspots(); }, [fetchHotspots]);

  useEffect(() => {
    const timer = setInterval(fetchHotspots, 30 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchHotspots]);

  useNotifications({ hasNew, newCount, hotspots });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetch('/api/sources/refresh', { method: 'POST' });
      await new Promise(r => setTimeout(r, 5000));
      await fetchHotspots();
    } catch (e) {
      console.error('Refresh failed:', e);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Main Content */}
      <div className="relative z-10">
        <Navbar
          page={page}
          onPageChange={setPage}
          hasNew={hasNew}
          newCount={newCount}
          onRefresh={handleRefresh}
          loading={loading}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {page === 'dashboard' && (
            <Dashboard
              hotspots={hotspots}
              loading={loading}
              onSelect={(id) => { setSelectedId(id); setPage('detail'); }}
            />
          )}
          {page === 'detail' && (
            <TopicDetail
              id={selectedId}
              onBack={() => setPage('dashboard')}
            />
          )}
          {page === 'agent' && (
            <AgentChat />
          )}
          {page === 'trends' && (
            <Trends hotspots={hotspots} />
          )}
          {page === 'settings' && (
            <Settings />
          )}
        </main>
      </div>
    </div>
  );
}
