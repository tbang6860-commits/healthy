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
    <div className="min-h-screen bg-[#0f0f0f]">
      <a href="#main-content" className="skip-link">跳到主要内容</a>
      <Navbar
        page={page}
        onPageChange={setPage}
        hasNew={hasNew}
        newCount={newCount}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <main id="main-content" className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
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
  );
}
