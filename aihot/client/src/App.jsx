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
  const [filters, setFilters] = useState({ sort: 'heat' });

  const fetchHotspots = useCallback(async (f = {}) => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (f.sort) params.set('sort', f.sort);
      if (f.source) params.set('source', f.source);
      if (f.heatLevel) params.set('heatLevel', f.heatLevel);
      if (f.sentiment) params.set('sentiment', f.sentiment);
      if (f.trend) params.set('trend', f.trend);
      if (f.minSources) params.set('minSources', f.minSources);
      if (f.onlyNew) params.set('onlyNew', f.onlyNew);

      const res = await fetch(`${API}?${params.toString()}`);
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

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setLoading(true);
    fetchHotspots(newFilters);
  }, [fetchHotspots]);

  useEffect(() => { fetchHotspots(filters); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setInterval(() => fetchHotspots(filters), 30 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchHotspots, filters]);

  useNotifications({ hasNew, newCount, hotspots });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetch('/api/sources/refresh', { method: 'POST' });
      await new Promise(r => setTimeout(r, 5000));
      await fetchHotspots(filters);
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
            filters={filters}
            onFilterChange={handleFilterChange}
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
