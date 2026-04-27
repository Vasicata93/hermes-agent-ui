import { useAgentStore } from '../../store/agentStore';

const WS_URL = 'ws://localhost:8000'; // Replace with env/config

export class HermesWebSocketClient {
  private static socket: WebSocket | null = null;
  private static pingInterval: number | null = null;
  private static reconnectTimeout: number | null = null;
  private static isConnecting = false;

  static connect() {
    if (this.socket || this.isConnecting) return;
    this.isConnecting = true;
    useAgentStore.getState().setHermesConnectionStatus('connecting');

    try {
      this.socket = new WebSocket(`${WS_URL}/stream`);

      this.socket.onopen = () => {
        console.log('Hermes WebSocket connected');
        this.isConnecting = false;
        useAgentStore.getState().setHermesConnectionStatus('connected');
        useAgentStore.getState().setMode('idle'); // Or connected state
        
        // Setup ping
        this.pingInterval = window.setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error('Failed to parse Hermes WebSocket message:', e);
        }
      };

      this.socket.onclose = () => {
        console.log('Hermes WebSocket disconnected');
        useAgentStore.getState().setHermesConnectionStatus('disconnected');
        this.cleanup();
        this.scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('Hermes WebSocket error:', error);
        // Error will often be followed by close
      };
    } catch (error) {
      console.error('Failed to instantiate WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  static disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.cleanup();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private static cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.isConnecting = false;
    this.socket = null;
  }

  private static scheduleReconnect() {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = window.setTimeout(() => {
        this.reconnectTimeout = null;
        this.connect();
      }, 5000);
    }
  }

  private static handleMessage(data: any) {
    const store = useAgentStore.getState();
    const { type, payload } = data;

    switch (type) {
      case 'status':
        // e.g., idle, running, error
        store.setMode(payload === 'running' ? 'agent' : 'idle');
        break;
        
      case 'log':
        // Handle incoming logs
        store.addAction({
          id: Date.now().toString(),
          toolName: 'Hermes',
          summary: payload.message || JSON.stringify(payload),
          status: 'success',
          timestamp: Date.now()
        });
        break;

      case 'execution_step':
        // Handle steps
        break;
        
      case 'stream_token':
         // Handle token streaming for chat interface if needed
         break;

      default:
        console.warn('Unhandled Hermes WebSocket message type:', type);
    }
  }
}
