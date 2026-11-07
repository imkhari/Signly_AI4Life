import { EventEnvelope, EventType } from '../../types';

export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type EventHandler<T = unknown> = (payload: T, envelope: EventEnvelope<T>) => void;
export type StatusHandler = (status: SocketStatus) => void;

export interface SocketConnectConfig {
  sessionId: string;
  role: 'patient' | 'nurse' | 'doctor';
  token: string;
  lastSeq?: number;
}

export class SocketClient {
  private ws: WebSocket | null = null;
  private config: SocketConnectConfig | null = null;
  private status: SocketStatus = 'disconnected';
  private lastSeq: number = 0;

  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  private eventListeners: Map<string, Set<EventHandler>> = new Map();
  private statusListeners: Set<StatusHandler> = new Set();
  private shouldReconnect = true;

  constructor() {
    this.handleMessage = this.handleMessage.bind(this);
  }

  getStatus(): SocketStatus {
    return this.status;
  }

  getLastSeq(): number {
    return this.lastSeq;
  }

  connect(config: SocketConnectConfig): void {
    this.config = config;
    this.lastSeq = config.lastSeq || 0;
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.initWebSocket();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearTimers();
    if (this.ws) {
      this.ws.close(1000, 'Client intentional disconnect');
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  private setStatus(newStatus: SocketStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((fn) => fn(newStatus));
    }
  }

  private initWebSocket(): void {
    if (!this.config) return;
    this.clearTimers();

    const { sessionId, role, token } = this.config;
    const wsBase = (import.meta.env?.VITE_WS_BASE as string) || '';
    let url: string;
    if (wsBase) {
      url = `${wsBase}/ws/${sessionId}?role=${role}&token=${encodeURIComponent(token)}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      url = `${protocol}//${host}/ws/${sessionId}?role=${role}&token=${encodeURIComponent(token)}`;
    }
    if (this.lastSeq > 0) {
      url += `&last_seq=${this.lastSeq}`;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus('connected');
      this.startHeartbeat();
    };

    this.ws.onmessage = this.handleMessage;

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      // Code 4001: Duplicate connection for role -> không tự reconnect đè
      // Code 1000: Bình thường
      if (event.code === 4001 || !this.shouldReconnect) {
        this.setStatus('disconnected');
        return;
      }
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // Sẽ tự đóng và kích hoạt onclose
    };
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return;
    this.setStatus('reconnecting');

    // Exponential backoff từ 0.5s đến tối đa 5s
    const delay = Math.min(500 * Math.pow(1.5, this.reconnectAttempts), 5000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.initWebSocket();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    // Heartbeat: PING mỗi 20s
    this.pingInterval = setInterval(() => {
      this.send('PING', {});
    }, 20000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string) as EventEnvelope;
      if (data.seq && data.seq > this.lastSeq) {
        this.lastSeq = data.seq;
      }

      // Heartbeat PONG
      if (data.event === 'PONG') {
        return;
      }

      // Notify specific event listeners
      const listeners = this.eventListeners.get(data.event);
      if (listeners) {
        listeners.forEach((handler) => handler(data.payload, data));
      }

      // Notify wildcard listeners
      const wildcard = this.eventListeners.get('*');
      if (wildcard) {
        wildcard.forEach((handler) => handler(data.payload, data));
      }
    } catch {
      // Bỏ qua tin nhắn không đúng định dạng
    }
  }

  send<T = unknown>(event: EventType | string, payload: T): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    const message = {
      event,
      payload,
    };
    this.ws.send(JSON.stringify(message));
  }

  on<T = unknown>(event: EventType | '*' | string, handler: EventHandler<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    const set = this.eventListeners.get(event)!;
    set.add(handler as EventHandler);

    return () => {
      set.delete(handler as EventHandler);
      if (set.size === 0) {
        this.eventListeners.delete(event);
      }
    };
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusListeners.add(handler);
    handler(this.status);
    return () => {
      this.statusListeners.delete(handler);
    };
  }
}

export const socketClient = new SocketClient();

