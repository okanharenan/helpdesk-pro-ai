import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);
const SOCKET_URL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
const API = import.meta.env.VITE_API_URL;

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const refreshUnread = async () => {
    try {
      const token = localStorage.getItem("helpdesk_token");
      if (!token) return;
      const { data } = await axios.get(`${API}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const total = data.reduce((sum, c) => sum + (c.unread || 0), 0);
      setUnreadCount(total);
    } catch {
      // silencioso — se falhar, mantém o número anterior
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("helpdesk_token");

    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setUnreadCount(0);
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    s.on("presence:update", ({ userId, online }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        online ? next.add(userId) : next.delete(userId);
        return next;
      });
    });

    s.on("presence:list", (ids) => setOnlineUsers(new Set(ids)));

    s.on("message:new", () => {
      refreshUnread();
    });

    socketRef.current = s;
    setSocket(s);
    refreshUnread();

    return () => s.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, unreadCount, refreshUnread }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}