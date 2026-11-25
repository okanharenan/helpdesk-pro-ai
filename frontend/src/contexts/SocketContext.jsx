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
  const [notifications, setNotifications] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [toast, setToast] = useState(null);
  const socketRef = useRef(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("helpdesk_token")}`,
  });

  // Notificações guardadas no servidor (valem em qualquer aparelho)
  const refreshNotifications = async () => {
    try {
      if (!localStorage.getItem("helpdesk_token")) return;
      const { data } = await axios.get(`${API}/notifications`, { headers: authHeaders() });
      setNotifications(data.items);
      setNotifUnread(data.unreadCount);
    } catch {
      // silencioso — mantém o que já estava na tela
    }
  };

  const markNotificationRead = async (id) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.readAt) return;
    // Atualiza a tela na hora; se o servidor falhar, recarrega o estado real
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setNotifUnread((c) => Math.max(0, c - 1));
    try {
      await axios.patch(`${API}/notifications/${id}/read`, null, { headers: authHeaders() });
    } catch {
      refreshNotifications();
    }
  };

  const markAllNotificationsRead = async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    setNotifUnread(0);
    try {
      await axios.post(`${API}/notifications/read-all`, null, { headers: authHeaders() });
    } catch {
      refreshNotifications();
    }
  };

  const dismissToast = () => setToast(null);

  // O aviso flutuante some sozinho depois de alguns segundos
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

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
      setNotifications([]);
      setNotifUnread(0);
      setToast(null);
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

    // Chegou uma notificação nova: entra no topo da lista e aparece o aviso flutuante
    s.on("notification:new", (n) => {
      setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, 50));
      setNotifUnread((c) => c + 1);
      setToast(n);
    });

    // Se a conexão cair e voltar, busca o que foi perdido nesse intervalo
    s.io.on("reconnect", () => refreshNotifications());

    socketRef.current = s;
    setSocket(s);
    refreshUnread();
    refreshNotifications();

    return () => s.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        unreadCount,
        refreshUnread,
        notifications,
        notifUnread,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        toast,
        dismissToast,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}