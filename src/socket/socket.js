const LOG_PREFIX = "[WS]";

function getWSURL() {
  const wsUrl = import.meta.env.VITE_WS_URL || "";
  if (wsUrl) {
    return wsUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "";
  if (apiUrl) {
    const url = new URL(apiUrl);
    const proto = url.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${url.host}/ws`;
  }

  if (import.meta.env.DEV) {
    return "ws://localhost:5000/ws";
  }

  const loc = window.location;
  const proto = loc.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${loc.host}/ws`;
}

let socket = null;
let listeners = {};
let reconnectTimer = null;
let ws = null;
let connected = false;
let manualClose = false;

export const connectSocket = () => {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return socket;
  }

  connected = false;
  manualClose = false;

  const connect = () => {
    if (manualClose) {
      return;
    }
    const url = getWSURL();
    ws = new WebSocket(url);

    ws.onopen = () => {
      connected = true;
      fire("connect");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        fire(msg.type, msg.data);
      } catch (e) {
      }
    };

    ws.onclose = (event) => {
      connected = false;
      fire("disconnect");
      if (!manualClose) {
        reconnectTimer = setTimeout(connect, 3000);
      } else {
      }
    };

    ws.onerror = (err) => {
    };
  };

  connect();

  socket = {
    get connected() { return connected; },
    on: (event, cb) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    },
    off: (event, cb) => {
      if (cb) {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter(l => l !== cb);
          if (listeners[event].length === 0) delete listeners[event];
        }
      } else {
        delete listeners[event];
      }
    },
    emit: (event, data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify({ type: event, data });
        ws.send(payload);
      } else {
      }
    },
    disconnect: () => {
      manualClose = true;
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
      if (ws) {
        ws = null;
      }
      connected = false;
      listeners = {};
    },
  };

  return socket;
};

function fire(event, data) {
  const cbs = listeners[event];
  if (cbs) {
    cbs.forEach((cb) => cb(data));
  } else {
  }
}

export const getSocket = () => {
  if (!socket) {
    connectSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
