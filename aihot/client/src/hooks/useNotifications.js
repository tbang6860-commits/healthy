import { useEffect, useRef } from 'react';

export function useNotifications({ hasNew, newCount, hotspots }) {
  const prevCount = useRef(0);
  const granted = useRef(false);

  useEffect(() => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      granted.current = true;
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => {
        granted.current = p === 'granted';
      });
    }
  }, []);

  useEffect(() => {
    if (!hasNew || !granted.current || newCount <= prevCount.current) {
      prevCount.current = newCount;
      return;
    }

    const newHotspots = hotspots.filter(h => h.is_new === 1).slice(0, 3);
    const titles = newHotspots.map(h => h.title).join('、');

    try {
      new Notification('AI 热点聚合', {
        body: `发现 ${newCount} 个新热点：${titles}${newCount > 3 ? '...' : ''}`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔥</text></svg>',
        tag: 'aihot-new',
      });
    } catch (e) {
      // 通知失败静默处理
    }

    // Title 闪烁
    const original = document.title;
    let flashes = 0;
    const flash = setInterval(() => {
      document.title = flashes % 2 === 0 ? `[新] ${original}` : original;
      flashes++;
      if (flashes >= 6) {
        clearInterval(flash);
        document.title = original;
      }
    }, 800);

    prevCount.current = newCount;
  }, [hasNew, newCount, hotspots]);
}
