import React, { useEffect, useRef, useState } from 'react';
import PlaylistPlayer, { CreativeItem } from './components/PlaylistPlayer';
import { ReconnectingSocket } from './services/socket';
import { getDevice, postDevice } from './services/api';

const DEVICE_ID = 51377;

const mapApiToCreativeItems = (rows: any[]): CreativeItem[] => {
  const isFiniteNumber = (val: any) => typeof val === 'number' && Number.isFinite(val);

  const parseHmsToSeconds = (t: any): number => {
    if (typeof t !== 'string') return 0;
    const parts = t.trim().split(':');
    if (parts.length !== 3) return 0;
    const [hh, mm, ss] = parts.map((p) => Number(p) || 0);
    return hh * 3600 + mm * 60 + ss;
  };

  const inferTypeFromUrl = (url: string): string => {
    const u = (url || '').toLowerCase();
    if (!u) return 'default';
    if (/\.mp4($|\?)/.test(u)) return 'mp4';
    if (/\.(jpg|jpeg)($|\?)/.test(u)) return 'jpeg';
    if (/\.png($|\?)/.test(u)) return 'png';
    if (/\.gif($|\?)/.test(u)) return 'gif';
    if (/^https?:\/\//.test(u)) return 'tag';
    return 'default';
  };

  const allowedTypes = new Set(['mp4', 'jpg', 'jpeg', 'png', 'gif', 'tag', 'default']);

  return (rows || [])
    .map((r, idx) => {
      const creative_url: string = r?.creative_url || r?.media_url || r?.url || '';

      let desiredType = (r?.creative_type || r?.media_type || '').toString().toLowerCase();
      if (!allowedTypes.has(desiredType)) {
        desiredType = inferTypeFromUrl(creative_url);
      }

      const startSeconds = parseHmsToSeconds(r?.start_time);
      const endSeconds = parseHmsToSeconds(r?.end_time);
      let media_duration: number = isFiniteNumber(r?.media_duration) ? Number(r.media_duration) : 0;
      if (!media_duration) {
        const diff = endSeconds > startSeconds ? (endSeconds - startSeconds) : 0;
        media_duration = diff || 10; // sensible fallback
      }

      const id = Number(r?.media_id ?? r?.id ?? idx);
      const slot = Number(r?.slot ?? idx + 1);

      return {
        id,
        slot,
        media_duration,
        creative_type: desiredType as any,
        creative_url,
        start_time_sec: startSeconds || undefined,
        end_time_sec: endSeconds || undefined,
        // carry-through raw API fields for scheduling/debugging
        start_time: typeof r?.start_time === 'string' ? r.start_time : undefined,
        end_time: typeof r?.end_time === 'string' ? r.end_time : undefined,
        device_id: isFiniteNumber(r?.device_id) ? Number(r.device_id) : undefined,
        screen_id: isFiniteNumber(r?.screen_id) ? Number(r.screen_id) : undefined,
        media_id: isFiniteNumber(r?.media_id) ? Number(r.media_id) : undefined,
        type: typeof r?.type === 'string' ? r.type : undefined,
        cmp_id: isFiniteNumber(r?.cmp_id) ? Number(r.cmp_id) : undefined,
        cmp_start_date_time: typeof r?.cmp_start_date_time === 'string' ? r.cmp_start_date_time : undefined,
        cmp_end_date_time: typeof r?.cmp_end_date_time === 'string' ? r.cmp_end_date_time : undefined,
        loopslot: isFiniteNumber(r?.loopslot) ? Number(r.loopslot) : undefined,
        created_at: typeof r?.created_at === 'string' ? r.created_at : undefined,
        updated_at: typeof r?.updated_at === 'string' ? r.updated_at : undefined,
      } as CreativeItem;
    })
    .filter((i) => Boolean(i.creative_url));
};

const isWithinCampaignWindow = (item: CreativeItem): boolean => {
  const startIso = item.cmp_start_date_time;
  const endIso = item.cmp_end_date_time;
  if (!startIso && !endIso) return true;
  const now = Date.now();
  const startMs = startIso ? Date.parse(startIso) : Number.NEGATIVE_INFINITY;
  const endMs = endIso ? Date.parse(endIso) : Number.POSITIVE_INFINITY;
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return true;
  return now >= startMs && now <= endMs;
};

const filterItemsBySchedule = (items: CreativeItem[]): CreativeItem[] => {
  return (items || []).filter((it) => isWithinCampaignWindow(it));
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
          const filtered = filterItemsBySchedule(mapped);
          setItems(filtered);
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
        if (Array.isArray(payload?.data)) {
          const mapped = mapApiToCreativeItems(payload.data);
          setItems(filterItemsBySchedule(mapped));
          return;
        }
        if (Array.isArray(payload?.items)) {
          setItems(filterItemsBySchedule(payload.items as CreativeItem[]));
          return;
        }
      });
    }

    // Start 3s poller to POST deviceId and update items
    pollRef.current = window.setInterval(() => {
      postDevice({ deviceId: DEVICE_ID })
        .then((res) => {
          const rows = Array.isArray(res?.data) ? res.data : [];
          const mapped = mapApiToCreativeItems(rows);
          const filtered = filterItemsBySchedule(mapped);
          if (filtered.length) setItems(filtered);
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