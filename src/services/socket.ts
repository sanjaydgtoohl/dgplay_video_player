export type MessageHandler<T> = (data: T) => void;

export interface SocketOptions {
  url: string | string[];
  reconnectDelayMs?: number;
  initialSubscribe?: { deviceId: number; token?: string };
}

function buildWsUrl(rawUrl: string): string {
  try {
    const needsScheme = !/^wss?:\/\//i.test(rawUrl);
    const pageIsHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';

    const url = needsScheme
      ? new URL(rawUrl, `${pageIsHttps ? 'wss' : 'ws'}://${window.location.host}`)
      : new URL(rawUrl);

    if (pageIsHttps && url.protocol !== 'wss:') {
      url.protocol = 'wss:';
    }

    return url.toString();
  } catch (_) {
    return rawUrl;
  }
}

export class ReconnectingSocket<T = unknown> {
  private urls: string[];
  private currentUrlIndex = 0;
  private baseReconnectDelayMs: number;
  private ws: WebSocket | null = null;
  private isClosedByUser = false;
  private subscribers = new Set<MessageHandler<T>>();
  private initialSubscribe?: { deviceId: number; token?: string };
  private attempt = 0;

  constructor(options: SocketOptions) {
    this.urls = Array.isArray(options.url) ? options.url : [options.url];
    this.baseReconnectDelayMs = options.reconnectDelayMs ?? 1500;
    this.initialSubscribe = options.initialSubscribe;
    this.connect();
  }

  private nextUrl() {
    if (this.urls.length <= 1) return;
    this.currentUrlIndex = (this.currentUrlIndex + 1) % this.urls.length;
  }

  private get currentRawUrl(): string {
    return this.urls[this.currentUrlIndex];
  }

  private scheduleReconnect() {
    if (this.isClosedByUser) return;
    this.attempt += 1;
    // rotate endpoint when failing
    this.nextUrl();
    const jitter = Math.random() * 300;
    const delay = Math.min(this.baseReconnectDelayMs * 2 ** (this.attempt - 1), 10000) + jitter;
    setTimeout(() => this.connect(), delay);
  }

  private connect() {
    if (this.ws) return;

    const effectiveUrl = buildWsUrl(this.currentRawUrl);

    try {
      this.ws = new WebSocket(effectiveUrl);
    } catch (e) {
      console.warn('[WS] construct error', e, 'url=', effectiveUrl);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[WS] open', effectiveUrl);
      this.attempt = 0;
      if (this.initialSubscribe) {
        try {
          this.ws?.send(JSON.stringify({ deviceId: this.initialSubscribe.deviceId, token: this.initialSubscribe.token }));
        } catch (e) {
          console.warn('[WS] initial payload send failed', e);
        }
      }
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as T;
        this.subscribers.forEach((fn) => fn(payload));
      } catch (e) {
        console.warn('[WS] parse error', e);
      }
    };

    this.ws.onclose = (ev: CloseEvent) => {
      console.warn('[WS] close', ev.code, ev.reason, 'url=', effectiveUrl);
      this.ws = null;
      this.scheduleReconnect();
    };

    this.ws.onerror = (e: Event) => {
      console.warn('[WS] error', e, 'url=', effectiveUrl);
    };
  }

  subscribe(handler: MessageHandler<T>) {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  send(data: unknown) {
    try {
      this.ws?.send(JSON.stringify(data));
    } catch (e) {
      console.warn('[WS] send failed', e);
    }
  }

  close() {
    this.isClosedByUser = true;
    try { this.ws?.close(); } catch (_) {}
    this.ws = null;
  }
}
