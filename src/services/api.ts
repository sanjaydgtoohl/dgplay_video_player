export interface DeviceRequest {
  deviceId: number;
}

export interface ApiOptions {
  baseUrl?: string;
}

// In dev, force relative base so Vite proxy handles CORS. In prod, use explicit base.
const DEFAULT_BASE = (import.meta as any).env?.DEV
  ? ''
  : ((import.meta as any).env?.VITE_API_BASE_URL || '');

async function request(path: string, init: RequestInit): Promise<Response> {
  const url = `${DEFAULT_BASE}${path}`;
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res;
}

// Use POST so deviceId is sent in body (backend expects body)
export async function getDevice(payload: DeviceRequest): Promise<any> {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  try {
    return await request('/api/devices', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      redirect: 'follow'
    }).then(r => r.json());
  } catch (err: any) {
    const msg = String(err?.message || '');
    const statusMatch = msg.match(/HTTP\s(\d{3})/);
    const status = statusMatch ? Number(statusMatch[1]) : 0;
    // Only fallback to GET when POST endpoint is missing or method not allowed
    if (status === 404 || status === 405) {
      const qs = new URLSearchParams({ deviceId: String(payload.deviceId) });
      return request(`/api/devices?${qs.toString()}`, {
        method: 'GET',
        headers,
        redirect: 'follow'
      }).then(r => r.json());
    }
    throw err;
  }
}

export async function postDevice(payload: DeviceRequest): Promise<any> {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  return request('/api/devices', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    redirect: 'follow'
  }).then(r => r.json());
}
