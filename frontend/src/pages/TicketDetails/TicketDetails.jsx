import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";
import { useMe } from "../../contexts/MeContext";

const API = import.meta.env.VITE_API_URL;

const STATUS_OPTIONS = ["OPEN", "DOING", "RESOLVED", "CLOSED"];
const STATUS = {
  OPEN: {
    label: "Aberto",
    bg: "rgba(239,68,68,0.1)",
    color: "#dc2626",
    icon: "ti-clock",
    gradient: "linear-gradient(135deg,#dc2626,#f87171)",
  },
  DOING: {
    label: "Em andamento",
    bg: "rgba(59,130,246,0.1)",
    color: "#2563eb",
    icon: "ti-loader",
    gradient: "linear-gradient(135deg,#2563eb,#60a5fa)",
  },
  RESOLVED: {
    label: "Resolvido",
    bg: "rgba(22,163,74,0.1)",
    color: "#16a34a",
    icon: "ti-circle-check",
    gradient: "linear-gradient(135deg,#16a34a,#4ade80)",
  },
  CLOSED: {
    label: "Fechado",
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    icon: "ti-lock",
    gradient: "linear-gradient(135deg,#6b7280,#9ca3af)",
  },
};
const PRIORITY = {
  HIGH: {
    label: "Alta",
    color: "#dc2626",
    bg: "rgba(239,68,68,0.08)",
    icon: "ti-flame",
  },
  MEDIUM: {
    label: "Média",
    color: "#d97706",
    bg: "rgba(217,119,6,0.08)",
    icon: "ti-minus",
  },
  LOW: {
    label: "Baixa",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.08)",
    icon: "ti-arrow-down",
  },
};
const ROLE_COLOR = {
  SUPERADMIN: {
    bg: "rgba(22,163,74,0.12)",
    color: "#16a34a",
    label: "Superadmin",
  },
  ADMIN: { bg: "rgba(59,130,246,0.12)", color: "#2563eb", label: "Admin" },
  AGENT: { bg: "rgba(217,119,6,0.1)", color: "#d97706", label: "Agente" },
  CLIENT: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", label: "Cliente" },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = useThemeColors();
  const { dark } = useTheme();
  const { me } = useMe();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [commentFocused, setCommentFocused] = useState(false);

  const token = localStorage.getItem("helpdesk_token");
  const headers = { Authorization: `Bearer ${token}` };
  const dbRole = me?.role;
  const canEdit = ["SUPERADMIN", "ADMIN"].includes(dbRole);
  const canDelete = dbRole === "SUPERADMIN";

  useEffect(() => {
    axios
      .get(`${API}/tickets/${id}`, { headers })
      .then((res) => setTicket(res.data))
      .catch(() => navigate("/tickets"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status) => {
    setUpdating(status);
    try {
      const { data } = await axios.patch(
        `${API}/tickets/${id}`,
        { status },
        { headers },
      );
      setTicket((p) => ({ ...p, status: data.status }));
    } finally {
      setUpdating(null);
    }
  };

  const handlePriorityChange = async (priority) => {
    try {
      const { data } = await axios.patch(
        `${API}/tickets/${id}`,
        { priority },
        { headers },
      );
      setTicket((p) => ({ ...p, priority: data.priority }));
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirm("Deletar este ticket permanentemente?")) return;
    await axios.delete(`${API}/tickets/${id}`, { headers });
    navigate("/tickets");
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    try {
      const { data } = await axios.post(
        `${API}/tickets/${id}/comments`,
        { body: comment },
        { headers },
      );
      setTicket((p) => ({ ...p, comments: [...p.comments, data] }));
      setComment("");
    } finally {
      setSending(false);
    }
  };

  const card = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 14,
    padding: "20px 22px",
    marginBottom: 14,
    boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: t.bg,
          fontFamily: "'Inter',system-ui,sans-serif",
        }}
      >
        <Sidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Navbar title={`Ticket #${id}`} subtitle="carregando chamado..." />
          <div style={{ padding: 22 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 300px",
                gap: 14,
              }}
            >
              {[1, 2].map((i) => (
                <div key={i} style={card}>
                  <div
                    className={dark ? "skeleton" : "skeleton-light"}
                    style={{
                      height: 22,
                      width: "55%",
                      borderRadius: 6,
                      marginBottom: 14,
                    }}
                  />
                  <div
                    className={dark ? "skeleton" : "skeleton-light"}
                    style={{
                      height: 13,
                      width: "100%",
                      borderRadius: 4,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    className={dark ? "skeleton" : "skeleton-light"}
                    style={{ height: 13, width: "75%", borderRadius: 4 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  const st = STATUS[ticket.status];
  const pr = PRIORITY[ticket.priority];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: t.bg,
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Navbar
          title={`Ticket #${ticket.id}`}
          subtitle="detalhes do chamado de suporte"
        />

        <div
          className="anim-fade"
          style={{ padding: 22, overflowY: "auto", flex: 1 }}
        >
          {/* Barra de ações */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <button
              onClick={() => navigate("/tickets")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                color: t.textSecondary,
                borderRadius: 9,
                padding: "8px 15px",
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = dark ? "#1a1a1a" : "#f9fafb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = t.cardBg;
              }}
            >
              <i
                className="ti ti-arrow-left"
                style={{ fontSize: 15 }}
                aria-hidden="true"
              />
              Voltar aos tickets
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Badge status atual */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 14px",
                  borderRadius: 99,
                  background: st.bg,
                  border: `1px solid ${st.color}30`,
                }}
              >
                <i
                  className={`ti ${st.icon}`}
                  style={{ fontSize: 14, color: st.color }}
                  aria-hidden="true"
                />
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: st.color }}
                >
                  {st.label}
                </span>
              </div>
              {/* Badge prioridade */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 13px",
                  borderRadius: 99,
                  background: pr.bg,
                  border: `1px solid ${pr.color}30`,
                }}
              >
                <i
                  className={`ti ${pr.icon}`}
                  style={{ fontSize: 13, color: pr.color }}
                  aria-hidden="true"
                />
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: pr.color }}
                >
                  {pr.label}
                </span>
              </div>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#dc2626",
                    borderRadius: 9,
                    padding: "8px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.06)";
                  }}
                >
                  <i
                    className="ti ti-trash"
                    style={{ fontSize: 14 }}
                    aria-hidden="true"
                  />
                  Deletar
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 290px",
              gap: 14,
            }}
          >
            {/* COLUNA PRINCIPAL */}
            <div>
              {/* Card principal do ticket */}
              <div
                style={{ ...card, position: "relative", overflow: "hidden" }}
              >
                {/* Accent top */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: st.gradient,
                    borderRadius: "14px 14px 0 0",
                  }}
                />

                <div style={{ marginTop: 8, marginBottom: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        background: st.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className={`ti ${st.icon}`}
                        style={{ fontSize: 20, color: st.color }}
                        aria-hidden="true"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2
                        style={{
                          fontSize: 19,
                          fontWeight: 700,
                          color: t.textPrimary,
                          lineHeight: 1.3,
                          marginBottom: 6,
                        }}
                      >
                        {ticket.title}
                      </h2>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: dark
                              ? "rgba(255,255,255,0.06)"
                              : "#f3f4f6",
                            color: t.textMuted,
                            fontWeight: 500,
                          }}
                        >
                          #{ticket.id}
                        </span>
                        <span style={{ fontSize: 11, color: t.textMuted }}>
                          ·
                        </span>
                        <span style={{ fontSize: 11, color: t.textMuted }}>
                          {new Date(ticket.createdAt).toLocaleDateString(
                            "pt-BR",
                            { day: "2-digit", month: "long", year: "numeric" },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: 14,
                    color: t.textSecondary,
                    lineHeight: 1.8,
                    marginBottom: ticket.fileUrl ? 16 : 0,
                    background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                    border: `1px solid ${t.border}`,
                    borderRadius: 9,
                    padding: "14px 16px",
                  }}
                >
                  {ticket.description}
                </p>

                {ticket.fileUrl && (
                  <a
                    href={
                      ticket.fileUrl?.startsWith("http")
                        ? ticket.fileUrl
                        : `${import.meta.env.VITE_API_URL || ""}${ticket.fileUrl}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                      color: "#2563eb",
                      padding: "7px 14px",
                      background: "rgba(59,130,246,0.08)",
                      borderRadius: 8,
                      textDecoration: "none",
                      marginTop: 14,
                      border: "1px solid rgba(59,130,246,0.2)",
                      fontWeight: 500,
                    }}
                  >
                    <i
                      className="ti ti-paperclip"
                      style={{ fontSize: 14 }}
                      aria-hidden="true"
                    />
                    Ver anexo
                  </a>
                )}

                {/* Meta info */}
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    marginTop: 18,
                    paddingTop: 16,
                    borderTop: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "10px 14px",
                      background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                      borderRadius: 9,
                      border: `1px solid ${t.border}`,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: dark ? "#1f1f1f" : "#e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.textSecondary,
                        flexShrink: 0,
                      }}
                    >
                      {ticket.user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: t.textMuted,
                          fontWeight: 500,
                          marginBottom: 2,
                        }}
                      >
                        Solicitante
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: t.textPrimary,
                          fontWeight: 600,
                        }}
                      >
                        {ticket.user.name}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "10px 14px",
                      background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                      borderRadius: 9,
                      border: `1px solid ${t.border}`,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: dark ? "rgba(22,163,74,0.1)" : "#f0fdf4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className="ti ti-calendar"
                        style={{ fontSize: 15, color: "#16a34a" }}
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: t.textMuted,
                          fontWeight: 500,
                          marginBottom: 2,
                        }}
                      >
                        Abertura
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: t.textPrimary,
                          fontWeight: 600,
                        }}
                      >
                        {new Date(ticket.createdAt).toLocaleDateString(
                          "pt-BR",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </div>
                    </div>
                  </div>

                  {canEdit ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "10px 14px",
                        background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                        borderRadius: 9,
                        border: `1px solid ${t.border}`,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: pr.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <i
                          className={`ti ${pr.icon}`}
                          style={{ fontSize: 15, color: pr.color }}
                          aria-hidden="true"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 10,
                            color: t.textMuted,
                            fontWeight: 500,
                            marginBottom: 4,
                          }}
                        >
                          Prioridade
                        </div>
                        <select
                          value={ticket.priority}
                          onChange={(e) => handlePriorityChange(e.target.value)}
                          style={{
                            background: "transparent",
                            border: "none",
                            fontSize: 13,
                            color: pr.color,
                            fontFamily: "'Inter',system-ui,sans-serif",
                            cursor: "pointer",
                            outline: "none",
                            fontWeight: 600,
                            padding: 0,
                            width: "100%",
                          }}
                        >
                          <option value="LOW">Baixa</option>
                          <option value="MEDIUM">Média</option>
                          <option value="HIGH">Alta</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "10px 14px",
                        background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                        borderRadius: 9,
                        border: `1px solid ${t.border}`,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: pr.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <i
                          className={`ti ${pr.icon}`}
                          style={{ fontSize: 15, color: pr.color }}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: t.textMuted,
                            fontWeight: 500,
                            marginBottom: 2,
                          }}
                        >
                          Prioridade
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: pr.color,
                            fontWeight: 600,
                          }}
                        >
                          {pr.label}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comentários */}
              <div style={card}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    paddingBottom: 14,
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 9 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: dark ? "rgba(59,130,246,0.1)" : "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i
                        className="ti ti-message"
                        style={{ fontSize: 16, color: "#2563eb" }}
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: t.textPrimary,
                        }}
                      >
                        Comentários
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          marginLeft: 8,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: dark ? "#1f1f1f" : "#f3f4f6",
                          color: t.textMuted,
                          fontWeight: 500,
                        }}
                      >
                        {ticket.comments.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginBottom: 16,
                    maxHeight: 420,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {ticket.comments.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "36px 0" }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          background: dark ? "#1a1a1a" : "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 12px",
                        }}
                      >
                        <i
                          className="ti ti-message-off"
                          style={{ fontSize: 24, color: t.textMuted }}
                          aria-hidden="true"
                        />
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          color: t.textPrimary,
                          fontWeight: 500,
                          marginBottom: 4,
                        }}
                      >
                        Nenhum comentário ainda
                      </p>
                      <p style={{ fontSize: 12, color: t.textMuted }}>
                        Seja o primeiro a comentar
                      </p>
                    </div>
                  ) : (
                    ticket.comments.map((c, i) => {
                      const isAgent = c.user.role !== "CLIENT";
                      const rs = ROLE_COLOR[c.user.role] || ROLE_COLOR.CLIENT;
                      const initials =
                        c.user.name
                          ?.split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase() || "U";
                      return (
                        <div
                          key={c.id}
                          className={`anim-fade anim-d${Math.min(i + 1, 5)}`}
                          style={{
                            background: isAgent
                              ? dark
                                ? "rgba(22,163,74,0.05)"
                                : "#f0fdf4"
                              : dark
                                ? "rgba(255,255,255,0.03)"
                                : "#f9fafb",
                            border: `1px solid ${isAgent ? (dark ? "rgba(22,163,74,0.15)" : "#bbf7d0") : t.border}`,
                            borderRadius: 11,
                            padding: "14px 16px",
                            borderLeft: isAgent
                              ? `3px solid ${dark ? "rgba(22,163,74,0.4)" : "#16a34a"}`
                              : `3px solid transparent`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                background: rs.bg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                                color: rs.color,
                                flexShrink: 0,
                                boxShadow: `0 0 0 1.5px ${rs.color}30`,
                              }}
                            >
                              {initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 7,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    color: t.textPrimary,
                                    fontWeight: 600,
                                  }}
                                >
                                  {c.user.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    padding: "2px 8px",
                                    borderRadius: 99,
                                    background: rs.bg,
                                    color: rs.color,
                                    fontWeight: 600,
                                  }}
                                >
                                  {rs.label}
                                </span>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                color: t.textMuted,
                                background: dark ? "#1a1a1a" : "#f3f4f6",
                                padding: "2px 8px",
                                borderRadius: 99,
                                border: `1px solid ${t.border}`,
                              }}
                            >
                              {timeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: 13,
                              color: t.textSecondary,
                              lineHeight: 1.7,
                              margin: 0,
                            }}
                          >
                            {c.body}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleComment}
                  style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}
                >
                  <div style={{ position: "relative" }}>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onFocus={() => setCommentFocused(true)}
                      onBlur={() => setCommentFocused(false)}
                      rows={3}
                      required
                      placeholder="Escreva um comentário..."
                      style={{
                        width: "100%",
                        background: t.inputBg,
                        border: `1.5px solid ${commentFocused ? "#16a34a" : t.border}`,
                        borderRadius: 10,
                        padding: "12px 14px",
                        fontSize: 13,
                        color: t.textPrimary,
                        fontFamily: "'Inter',system-ui,sans-serif",
                        outline: "none",
                        resize: "vertical",
                        marginBottom: 10,
                        transition: "border-color 0.15s",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 11, color: t.textMuted }}>
                      {comment.length > 0 && `${comment.length} caracteres`}
                    </span>
                    <button
                      type="submit"
                      disabled={sending || !comment.trim()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "9px 18px",
                        background:
                          sending || !comment.trim()
                            ? t.border
                            : "linear-gradient(135deg,#16a34a,#22c55e)",
                        border: "none",
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 600,
                        color:
                          sending || !comment.trim() ? t.textMuted : "#fff",
                        cursor:
                          sending || !comment.trim()
                            ? "not-allowed"
                            : "pointer",
                        transition: "all 0.15s",
                        boxShadow:
                          sending || !comment.trim()
                            ? "none"
                            : "0 2px 8px rgba(22,163,74,0.3)",
                      }}
                    >
                      <i
                        className={`ti ${sending ? "ti-loader-2 anim-spin" : "ti-send"}`}
                        style={{ fontSize: 14 }}
                        aria-hidden="true"
                      />
                      {sending ? "Enviando..." : "Enviar comentário"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* COLUNA LATERAL */}
            <div>
              {/* Status */}
              <div style={card}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                    paddingBottom: 12,
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: st.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className={`ti ${st.icon}`}
                      style={{ fontSize: 15, color: st.color }}
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.textPrimary,
                    }}
                  >
                    Status do chamado
                  </span>
                </div>

                {/* Status atual */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: st.bg,
                    border: `1px solid ${st.color}25`,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <i
                    className={`ti ${st.icon}`}
                    style={{ fontSize: 16, color: st.color }}
                    aria-hidden="true"
                  />
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: st.color }}
                  >
                    {st.label}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      color: st.color,
                      opacity: 0.7,
                    }}
                  >
                    atual
                  </span>
                </div>

                {canEdit ? (
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: t.textMuted,
                        fontWeight: 500,
                        marginBottom: 8,
                      }}
                    >
                      Alterar para:
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {STATUS_OPTIONS.filter((s) => s !== ticket.status).map(
                        (s) => {
                          const ss = STATUS[s];
                          const isUpdating = updating === s;
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(s)}
                              disabled={!!updating}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                                padding: "10px 13px",
                                background: "transparent",
                                borderRadius: 9,
                                fontSize: 13,
                                cursor: !!updating ? "not-allowed" : "pointer",
                                textAlign: "left",
                                border: `1.5px solid ${ss.color}30`,
                                color: ss.color,
                                transition: "all 0.15s",
                                opacity: updating && !isUpdating ? 0.4 : 1,
                                fontWeight: 500,
                              }}
                              onMouseEnter={(e) => {
                                if (!updating)
                                  e.currentTarget.style.background = ss.bg;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                              }}
                            >
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 7,
                                  background: ss.bg,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <i
                                  className={`ti ${isUpdating ? "ti-loader-2 anim-spin" : ss.icon}`}
                                  style={{ fontSize: 14, color: ss.color }}
                                  aria-hidden="true"
                                />
                              </div>
                              {ss.label}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 12px",
                      background: dark ? "#1a1a1a" : "#f9fafb",
                      borderRadius: 9,
                      border: `1px solid ${t.border}`,
                    }}
                  >
                    <i
                      className="ti ti-lock"
                      style={{ fontSize: 14, color: t.textMuted }}
                      aria-hidden="true"
                    />
                    <span style={{ fontSize: 12, color: t.textMuted }}>
                      {dbRole === "AGENT"
                        ? "Agentes não alteram status"
                        : "Apenas admins"}
                    </span>
                  </div>
                )}
              </div>

              {/* Detalhes */}
              <div style={card}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                    paddingBottom: 12,
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: dark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className="ti ti-info-circle"
                      style={{ fontSize: 15, color: t.textMuted }}
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.textPrimary,
                    }}
                  >
                    Detalhes
                  </span>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 0 }}
                >
                  {[
                    {
                      label: "ID do ticket",
                      value: `#${ticket.id}`,
                      icon: "ti-hash",
                      mono: true,
                    },
                    {
                      label: "Prioridade",
                      value: null,
                      icon: pr.icon,
                      isP: true,
                    },
                    {
                      label: "Total comentários",
                      value: `${ticket.comments.length} comentário${ticket.comments.length !== 1 ? "s" : ""}`,
                      icon: "ti-message",
                      mono: false,
                    },
                    {
                      label: "Solicitante",
                      value: ticket.user.name,
                      icon: "ti-user",
                      mono: false,
                    },
                    {
                      label: "Data de abertura",
                      value: new Date(ticket.createdAt).toLocaleDateString(
                        "pt-BR",
                        { day: "2-digit", month: "long", year: "numeric" },
                      ),
                      icon: "ti-calendar",
                      mono: false,
                    },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 0",
                        borderBottom:
                          i < 4 ? `1px solid ${t.borderLight}` : "none",
                      }}
                    >
                      <i
                        className={`ti ${item.icon}`}
                        style={{
                          fontSize: 15,
                          color: t.textMuted,
                          flexShrink: 0,
                          width: 18,
                          textAlign: "center",
                        }}
                        aria-hidden="true"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 10,
                            color: t.textMuted,
                            fontWeight: 500,
                            marginBottom: 2,
                          }}
                        >
                          {item.label}
                        </div>
                        {item.isP ? (
                          <span
                            style={{
                              fontSize: 12,
                              padding: "3px 9px",
                              borderRadius: 99,
                              fontWeight: 600,
                              background: pr.bg,
                              color: pr.color,
                            }}
                          >
                            {pr.label}
                          </span>
                        ) : (
                          <div
                            style={{
                              fontSize: 13,
                              color: t.textPrimary,
                              fontWeight: 500,
                              fontFamily: item.mono ? "monospace" : "inherit",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.value}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linha do tempo de status */}
              <div style={card}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                    paddingBottom: 12,
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: dark ? "rgba(124,58,237,0.1)" : "#ede9fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className="ti ti-git-branch"
                      style={{ fontSize: 15, color: "#7c3aed" }}
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.textPrimary,
                    }}
                  >
                    Fluxo de status
                  </span>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 0 }}
                >
                  {STATUS_OPTIONS.map((s, i) => {
                    const ss = STATUS[s];
                    const isActive = ticket.status === s;
                    const statusOrder = STATUS_OPTIONS.indexOf(ticket.status);
                    const isDone = i < statusOrder;
                    return (
                      <div
                        key={s}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              background: isActive
                                ? ss.gradient
                                : isDone
                                  ? "rgba(22,163,74,0.12)"
                                  : dark
                                    ? "#1a1a1a"
                                    : "#f3f4f6",
                              border: `2px solid ${isActive ? ss.color : isDone ? "#16a34a" : t.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                              boxShadow: isActive
                                ? `0 0 10px ${ss.color}40`
                                : "none",
                            }}
                          >
                            {isDone ? (
                              <i
                                className="ti ti-check"
                                style={{ fontSize: 12, color: "#16a34a" }}
                                aria-hidden="true"
                              />
                            ) : (
                              <i
                                className={`ti ${ss.icon}`}
                                style={{
                                  fontSize: 12,
                                  color: isActive ? "#fff" : t.textMuted,
                                }}
                                aria-hidden="true"
                              />
                            )}
                          </div>
                          {i < STATUS_OPTIONS.length - 1 && (
                            <div
                              style={{
                                width: 2,
                                height: 20,
                                background: isDone ? "#16a34a" : t.border,
                                marginTop: 2,
                                borderRadius: 99,
                                transition: "background 0.3s",
                              }}
                            />
                          )}
                        </div>
                        <div
                          style={{
                            paddingTop: 4,
                            paddingBottom:
                              i < STATUS_OPTIONS.length - 1 ? 14 : 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: isActive ? 600 : 400,
                              color: isActive
                                ? ss.color
                                : isDone
                                  ? "#16a34a"
                                  : t.textMuted,
                            }}
                          >
                            {ss.label}
                          </span>
                          {isActive && (
                            <span
                              style={{
                                fontSize: 10,
                                marginLeft: 6,
                                padding: "1px 6px",
                                borderRadius: 99,
                                background: ss.bg,
                                color: ss.color,
                                fontWeight: 500,
                              }}
                            >
                              atual
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
