import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../../contexts/ThemeContext";
import { useMe } from "../../contexts/MeContext";
import { useSocket } from "../../contexts/SocketContext";
import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";

const API = import.meta.env.VITE_API_URL;

export default function Chat() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const { me } = useMe();
  const { socket, onlineUsers } = useSocket();

  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef(null);

  const bg = dark ? "#0f0f0f" : "#ffffff";
  const border = dark ? "#1f1f1f" : "#e5e7eb";
  const textColor = dark ? "#f4f4f4" : "#111111";
  const muted = dark ? "#555555" : "#9ca3af";
  const hoverBg = dark ? "#161616" : "#f8fafc";
  const inputBg = dark ? "#1a1a1a" : "#f9fafb";

  const token = localStorage.getItem("helpdesk_token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const loadConversations = () => {
    axios.get(`${API}/chat/conversations`, authHeader).then((r) => setConversations(r.data));
  };

  useEffect(() => {
    axios.get(`${API}/chat/contacts`, authHeader).then((r) => setContacts(r.data));
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    axios.get(`${API}/chat/messages/${selected.id}`, authHeader).then((r) => setMessages(r.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (msg) => {
      if (selected && (msg.senderId === selected.id || msg.receiverId === selected.id)) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderId === selected.id) {
          socket.emit("message:read", { senderId: selected.id });
        }
      }
      loadConversations();
    };

    socket.on("message:new", onNew);
    return () => socket.off("message:new", onNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = (person) => {
    setSelected(person);
    if (socket) socket.emit("message:read", { senderId: person.id });
  };

  const sendMessage = () => {
    if (!text.trim() || !selected || !socket) return;
    socket.emit("message:send", { receiverId: selected.id, body: text.trim() });
    setText("");
  };

  const merged = contacts
    .map((c) => {
      const conv = conversations.find((cv) => cv.user.id === c.id);
      return {
        ...c,
        lastMessage: conv?.lastMessage,
        lastMessageAt: conv?.lastMessageAt,
        unread: conv?.unread || 0,
      };
    })
    .sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt) return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      return a.name.localeCompare(b.name);
    })
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const initialsOf = (name) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: bg,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Navbar title="Chat" subtitle="converse com a equipe" />

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Lista de contatos */}
          <div style={{ width: 300, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${border}` }}>
              <button
                onClick={() => navigate("/")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "none",
                  color: muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  marginBottom: 12,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = textColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = muted)}
              >
                <i className="ti ti-arrow-left" style={{ fontSize: 14 }} aria-hidden="true" />
                Voltar ao HelpDesk
              </button>

              <input
                placeholder="Buscar pessoa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: inputBg,
                  color: textColor,
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {merged.map((c) => {
                const isSelected = selected?.id === c.id;
                const online = onlineUsers.has(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => openConversation(c)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                      background: isSelected ? hoverBg : "transparent",
                      borderBottom: `1px solid ${border}`,
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: "linear-gradient(135deg,#16a34a,#22c55e)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {initialsOf(c.name)}
                      </div>
                      {online && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: -1,
                            right: -1,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#16a34a",
                            border: `2px solid ${bg}`,
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{c.name}</span>
                        {c.unread > 0 && (
                          <span
                            style={{
                              fontSize: 10,
                              background: "#16a34a",
                              color: "#fff",
                              borderRadius: 99,
                              padding: "1px 6px",
                              fontWeight: 700,
                            }}
                          >
                            {c.unread}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: muted,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.lastMessage || c.email}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Área de conversa */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {selected ? (
              <>
                <div
                  style={{
                    padding: "14px 20px",
                    borderBottom: `1px solid ${border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "linear-gradient(135deg,#16a34a,#22c55e)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {initialsOf(selected.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{selected.name}</div>
                    <div style={{ fontSize: 11, color: muted }}>
                      {onlineUsers.has(selected.id) ? "online" : "offline"}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {messages.map((m) => {
                    const mine = m.senderId === me?.id;
                    return (
                      <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                        <div
                          style={{
                            maxWidth: "60%",
                            padding: "8px 12px",
                            borderRadius: 12,
                            background: mine ? "#16a34a" : inputBg,
                            color: mine ? "#fff" : textColor,
                            fontSize: 13,
                            border: mine ? "none" : `1px solid ${border}`,
                          }}
                        >
                          {m.body}
                          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <div style={{ padding: 16, borderTop: `1px solid ${border}`, display: "flex", gap: 10 }}>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Escreva uma mensagem..."
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${border}`,
                      background: inputBg,
                      color: textColor,
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: "#16a34a",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontSize: 14 }}>
                Selecione uma pessoa para começar a conversar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}