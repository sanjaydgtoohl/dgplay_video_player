import React, { useEffect, useRef, useState } from 'react';
import PlaylistPlayer, { CreativeItem } from './components/PlaylistPlayer';
import { ReconnectingSocket } from './services/socket';
import { getDevice, postDevice } from './services/api';

const DEVICE_ID = 51377;

const mapApiToCreativeItems = (rows: any[]): CreativeItem[] => {
  return (rows || [])
    .map((r, idx) => {
      const creative_type = (r.media_type || '').toLowerCase();
      const creative_url = r.media_url || '';
      const media_duration = typeof r.media_duration === 'number' ? r.media_duration : 10;
      return {
        id: Number(r.media_id ?? idx),
        slot: Number(idx + 1),
        media_duration,
        creative_type,
        creative_url,
      } as CreativeItem;
    })
    .filter(i => Boolean(i.creative_url));
};

const App: React.FC = () => {
  const [items, setItems] = useState<CreativeItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const socketRef = useRef<ReconnectingSocket<any> | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial fetch
    getDevice({ deviceId: DEVICE_ID })
      .then((res) => {
        try {
          const rows = Array.isArray(res?.data) ? res.data : [];
          const mapped = mapApiToCreativeItems(rows);
          setItems(mapped);
        } catch (e) {
          console.warn('[API] Map failed', e, res);
        }
      })
      .catch((err) => {
        console.error('[API] getDevice failed', err);
        setErrorMessage(`Failed to fetch initial playlist. Check API server. ${err?.message ?? ''}`);
      });

    const url = (import.meta.env.VITE_SOCKET_URL as string | undefined);
    let unsubscribe: () => void = () => {};
    if (url) {
      const ws = new ReconnectingSocket<{ items?: CreativeItem[]; data?: any[]; error?: string; type?: string; message?: string }>({
        url,
        initialSubscribe: { deviceId: DEVICE_ID }
      });
      socketRef.current = ws;
      unsubscribe = ws.subscribe((payload: { items?: CreativeItem[]; data?: any[]; error?: string; type?: string; message?: string }) => {
        if (typeof payload === 'string') return;
        if (payload?.type === 'welcome') { setErrorMessage(null); return; }
        if (payload?.error) { console.error('[WS] Server error', payload.error); setErrorMessage(`Socket error: ${payload.error}`); return; }
        if (Array.isArray(payload?.data)) { setItems(mapApiToCreativeItems(payload.data)); return; }
        if (Array.isArray(payload?.items)) { setItems(payload.items as CreativeItem[]); return; }
      });
    }

    // Start 3s poller to POST deviceId and update items
    pollRef.current = window.setInterval(() => {
      postDevice({ deviceId: DEVICE_ID })
        .then((res) => {
          const rows = Array.isArray(res?.data) ? res.data : [];
          const mapped = mapApiToCreativeItems(rows);
          if (mapped.length) setItems(mapped);
        })
        .catch((err) => {
          console.warn('[API] postDevice poll failed', err?.message || err);
        });
      // Optional: also ping socket with deviceId
      try { socketRef.current?.send({ deviceId: DEVICE_ID }); } catch {}
    }, 300000);

    return () => {
      unsubscribe();
      socketRef.current?.close();
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full">
        {errorMessage && (
          <div className="mb-2 w-full bg-red-50 px-4 py-2 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
        <PlaylistPlayer items={items} />
      </div>
    </div>
  );
};

export default App;