import { getGoogleToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const WS_URL_OVERRIDE = process.env.NEXT_PUBLIC_WS_URL || "";

function getWSURL(): string {
  if (WS_URL_OVERRIDE) return WS_URL_OVERRIDE;
  const url = new URL(API_BASE);
  const proto = url.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${url.host}/ws`;
}

type Listener = (data: unknown) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retries = 0;
  private manualClose = false;
  private isConnected = false;

  connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.manualClose = false;

    try {
      const base = getWSURL();
      const token = getGoogleToken();
      const url = token ? `${base}?token=${encodeURIComponent(token)}` : base;
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.isConnected = true;
        this.retries = 0;
        this.fire("connect", null);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            data?: unknown;
          };
          this.fire(msg.type, msg.data);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        this.isConnected = false;
        this.fire("disconnect", null);
        this.ws = null;
        if (!this.manualClose) {
          const delay = Math.min(1000 * 2 ** this.retries, 15000);
          this.retries += 1;
          this.reconnectTimer = setTimeout(() => this.connect(), delay);
        }
      };

      ws.onerror = () => {
        // close event follows; reconnection handled there
      };
    } catch {
      // invalid URL etc. — retry later
      if (!this.manualClose) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
    }
  }

  on(event: string, listener: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener?: Listener): void {
    if (listener) {
      this.listeners.get(event)?.delete(listener);
    } else {
      this.listeners.delete(event);
    }
  }

  emit(event: string, data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: event, data }));
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }

  disconnect(): void {
    this.manualClose = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
    this.listeners.clear();
  }

  private fire(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }
}

let instance: SocketClient | null = null;

export function getSocket(): SocketClient {
  if (!instance) {
    instance = new SocketClient();
  }
  return instance;
}
