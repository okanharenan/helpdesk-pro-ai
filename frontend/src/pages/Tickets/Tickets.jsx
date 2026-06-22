import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";

const API = import.meta.env.VITE_API_URL;

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
const FILTERS = [
  { key: "ALL", label: "Todos", icon: "ti-ticket", accent: "#16a34a" },
  { key: "OPEN", label: "Abertos", icon: "ti-clock", accent: "#dc2626" },
  { key: "DOING", label: "Andamento", icon: "ti-loader", accent: "#2563eb" },
  {
    key: "RESOLVED",
    label: "Resolvidos",
    icon: "ti-circle-check",
    accent: "#16a34a",
  },
  { key: "CLOSED", label: "Fechados", icon: "ti-lock", accent: "#6b7280" },
];

export default function Tickets() {
  const navigate = useNavigate();
  const t = useThemeColors();
  const { dark } = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("helpdesk_token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchTickets = async () => {
    try {
      const { data } = await axios.get(`${API}/tickets`, { headers });
      setTickets(data);
    } catch {
      console.error("Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("priority", form.priority);
      if (file) fd.append("file", file);
      await axios.post(`${API}/tickets`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setForm({ title: "", description: "", priority: "MEDIUM" });
      setFile(null);
      setShowForm(false);
      fetchTickets();
    } catch {
      setError("Erro ao abrir ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const sorted = [...tickets]
    .filter((tk) => filter === "ALL" || tk.status === filter)
    .filter(
      (tk) =>
        !search ||
        tk.title.toLowerCase().includes(search.toLowerCase()) ||
        tk.description?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "newest"
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt),
    );

  const counts = {
    ALL: tickets.length,
    OPEN: tickets.filter((t) => t.status === "OPEN").length,
    DOING: tickets.filter((t) => t.status === "DOING").length,
    RESOLVED: tickets.filter((t) => t.status === "RESOLVED").length,
    CLOSED: tickets.filter((t) => t.status === "CLOSED").length,
  };

  const urgentCount = tickets.filter(
    (t) => t.priority === "HIGH" && t.status === "OPEN",
  ).length;
  const card = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 14,
    boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
  };
  const inp = {
    background: t.inputBg,
    border: `1px solid ${t.border}`,
    borderRadius: 9,
    padding: "9px 12px",
    fontSize: 13,
    color: t.textPrimary,
    fontFamily: "'Inter',system-ui,sans-serif",
    outline: "none",
    width: "100%",
  };
  const lbl = {
    fontSize: 11,
    color: t.textMuted,
    fontWeight: 500,
    marginBottom: 5,
    display: "block",
  };

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
          title="Tickets"
          subtitle="gerenciamento de chamados de suporte"
        />

        <div
          className="anim-fade"
          style={{ padding: 22, flex: 1, overflowY: "auto" }}
        >
          {/* Alerta urgente */}
          {!loading && urgentCount > 0 && (
            <div
              className="anim-slide"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 16px",
                borderRadius: 10,
                background: dark ? "rgba(239,68,68,0.08)" : "#fff5f5",
                border: "1px solid rgba(239,68,68,0.25)",
                marginBottom: 16,
              }}
            >
              <i
                className="ti ti-alert-triangle"
                style={{ fontSize: 16, color: "#dc2626", flexShrink: 0 }}
                aria-hidden="true"
              />
              <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                {urgentCount} ticket{urgentCount > 1 ? "s" : ""} urgente
                {urgentCount > 1 ? "s" : ""} aguardando atenção
              </span>
              <button
                onClick={() => setFilter("OPEN")}
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  color: "#dc2626",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 7,
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Ver agora →
              </button>
            </div>
          )}

          {/* Cards de filtro */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5,1fr)",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const accent = active ? f.accent : t.textMuted;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: "14px",
                    borderRadius: 12,
                    border: `1.5px solid ${active ? f.accent + "40" : t.border}`,
                    background: active
                      ? dark
                        ? `${f.accent}12`
                        : f.accent + "08"
                      : t.cardBg,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: active
                      ? dark
                        ? "none"
                        : `0 2px 8px ${f.accent}20`
                      : "none",
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: f.accent,
                        borderRadius: "12px 12px 0 0",
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: active
                          ? `${f.accent}18`
                          : dark
                            ? "rgba(255,255,255,0.05)"
                            : "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i
                        className={`ti ${f.icon}`}
                        style={{ fontSize: 14, color: accent }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: active ? f.accent : t.textPrimary,
                      lineHeight: 1,
                      marginBottom: 4,
                    }}
                  >
                    {loading ? "—" : counts[f.key]}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: accent,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {f.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Barra de ações */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: 1,
                maxWidth: 320,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: "8px 13px",
                  flex: 1,
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#16a34a")}
                onBlur={(e) => (e.currentTarget.style.borderColor = t.border)}
              >
                <i
                  className="ti ti-search"
                  style={{ fontSize: 15, color: t.textMuted, flexShrink: 0 }}
                  aria-hidden="true"
                />
                <input
                  placeholder="Buscar tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: t.textPrimary,
                    flex: 1,
                    fontFamily: "inherit",
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: t.textMuted,
                      cursor: "pointer",
                      fontSize: 14,
                      padding: 0,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Ordenação */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 9,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: t.textSecondary,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
              </select>

              <button
                onClick={() => setShowForm(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 17px",
                  background: "linear-gradient(135deg,#16a34a,#22c55e)",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 14px rgba(22,163,74,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(22,163,74,0.3)";
                }}
              >
                <i
                  className="ti ti-plus"
                  style={{ fontSize: 15 }}
                  aria-hidden="true"
                />
                Novo Ticket
              </button>
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <div style={card}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "70px 1fr 150px 110px 110px 80px",
                    gap: 12,
                    padding: "16px",
                    borderBottom: `1px solid ${t.borderLight}`,
                    alignItems: "center",
                  }}
                >
                  {[40, 220, 80, 60, 70, 50].map((w, j) => (
                    <div
                      key={j}
                      className={dark ? "skeleton" : "skeleton-light"}
                      style={{
                        height: 13,
                        width: w,
                        borderRadius: 4,
                        animationDelay: `${j * 0.06}s`,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ ...card, padding: "64px 20px", textAlign: "center" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  background: dark ? "#1a1a1a" : "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <i
                  className="ti ti-ticket-off"
                  style={{ fontSize: 28, color: t.textMuted }}
                  aria-hidden="true"
                />
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: t.textPrimary,
                  marginBottom: 6,
                }}
              >
                Nenhum ticket encontrado
              </div>
              <div
                style={{ fontSize: 13, color: t.textMuted, marginBottom: 18 }}
              >
                {search
                  ? "Tente uma busca diferente"
                  : filter !== "ALL"
                    ? `Não há tickets com status "${FILTERS.find((f) => f.key === filter)?.label}"`
                    : "Abra o primeiro chamado da sua equipe"}
              </div>
              {filter !== "ALL" && (
                <button
                  onClick={() => setFilter("ALL")}
                  style={{
                    fontSize: 13,
                    color: "#16a34a",
                    background: "rgba(22,163,74,0.08)",
                    border: "1px solid rgba(22,163,74,0.2)",
                    borderRadius: 9,
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Ver todos os tickets
                </button>
              )}
            </div>
          ) : (
            <div style={card}>
              {/* Header tabela */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr 150px 110px 120px 80px",
                  gap: 12,
                  padding: "11px 16px",
                  borderBottom: `1px solid ${t.border}`,
                  fontSize: 11,
                  color: t.textMuted,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  background: dark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  borderRadius: "14px 14px 0 0",
                }}
              >
                <span>ID</span>
                <span>Chamado</span>
                <span>Status</span>
                <span>Prioridade</span>
                <span>Abertura</span>
                <span></span>
              </div>

              {sorted.map((tk, i) => {
                const st = STATUS[tk.status];
                const pr = PRIORITY[tk.priority];
                return (
                  <div
                    key={tk.id}
                    className={`anim-fade anim-d${Math.min(i + 1, 5)}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "64px 1fr 150px 110px 120px 80px",
                      gap: 12,
                      padding: "14px 16px",
                      borderBottom: `1px solid ${t.borderLight}`,
                      alignItems: "center",
                      transition: "background 0.12s",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/tickets/${tk.id}`)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = t.rowHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {/* ID */}
                    <div>
                      <span
                        style={{
                          fontSize: 12,
                          color: t.textMuted,
                          fontWeight: 600,
                          fontFamily: "monospace",
                        }}
                      >
                        #{tk.id}
                      </span>
                    </div>

                    {/* Título */}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: t.textPrimary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: 3,
                        }}
                      >
                        {tk.title}
                      </div>
                      {tk.description && (
                        <div
                          style={{
                            fontSize: 11,
                            color: t.textMuted,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tk.description}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: 99,
                          fontWeight: 500,
                          background: st.bg,
                          color: st.color,
                        }}
                      >
                        <i
                          className={`ti ${st.icon}`}
                          style={{ fontSize: 11 }}
                          aria-hidden="true"
                        />
                        {st.label}
                      </span>
                    </span>

                    {/* Prioridade */}
                    <span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: 99,
                          fontWeight: 500,
                          background: pr.bg,
                          color: pr.color,
                        }}
                      >
                        <i
                          className={`ti ${pr.icon}`}
                          style={{ fontSize: 11 }}
                          aria-hidden="true"
                        />
                        {pr.label}
                      </span>
                    </span>

                    {/* Data */}
                    <span style={{ fontSize: 12, color: t.textMuted }}>
                      {new Date(tk.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    {/* Ação */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tickets/${tk.id}`);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "6px 12px",
                        background: dark ? "rgba(22,163,74,0.1)" : "#f0fdf4",
                        border: `1px solid ${dark ? "rgba(22,163,74,0.2)" : "#bbf7d0"}`,
                        borderRadius: 8,
                        color: "#16a34a",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(22,163,74,0.2)";
                        e.currentTarget.style.transform = "scale(1.03)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = dark
                          ? "rgba(22,163,74,0.1)"
                          : "#f0fdf4";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      Ver{" "}
                      <i
                        className="ti ti-arrow-right"
                        style={{ fontSize: 13 }}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                );
              })}

              {/* Footer */}
              <div
                style={{
                  padding: "10px 16px",
                  fontSize: 12,
                  color: t.textMuted,
                  borderTop: `1px solid ${t.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: dark ? "rgba(255,255,255,0.01)" : "#fafafa",
                  borderRadius: "0 0 14px 14px",
                }}
              >
                <span>
                  {sorted.length} ticket{sorted.length !== 1 ? "s" : ""}{" "}
                  {filter !== "ALL"
                    ? `com status "${FILTERS.find((f) => f.key === filter)?.label}"`
                    : "no total"}
                </span>
                {search && (
                  <span style={{ color: "#16a34a" }}>
                    Filtrando por "{search}"
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal novo ticket */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: t.overlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="anim-scale"
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              padding: "0",
              width: "100%",
              maxWidth: 500,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            {/* Header do modal */}
            <div
              style={{
                padding: "20px 24px 18px",
                borderBottom: `1px solid ${t.border}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: dark ? "rgba(22,163,74,0.04)" : "#f0fdf4",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: "rgba(22,163,74,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <i
                  className="ti ti-ticket"
                  style={{ fontSize: 20, color: "#16a34a" }}
                  aria-hidden="true"
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: t.textPrimary,
                  }}
                >
                  Abrir novo chamado
                </div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>
                  Descreva o problema para nossa equipe de suporte
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: dark ? "#1a1a1a" : "#f3f4f6",
                  border: "none",
                  color: t.textMuted,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px 24px" }}>
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div>
                  <label style={lbl}>Título do chamado</label>
                  <input
                    style={inp}
                    placeholder="Ex: Elevador parado no 3º andar"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label style={lbl}>Descrição detalhada</label>
                  <textarea
                    style={{ ...inp, height: 90, resize: "vertical" }}
                    placeholder="Descreva o problema com detalhes — local, horário, o que aconteceu..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label style={lbl}>Nível de prioridade</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 8,
                    }}
                  >
                    {[
                      {
                        value: "LOW",
                        label: "Baixa",
                        desc: "Não urgente",
                        color: "#6b7280",
                        icon: "ti-arrow-down",
                      },
                      {
                        value: "MEDIUM",
                        label: "Média",
                        desc: "Moderado",
                        color: "#d97706",
                        icon: "ti-minus",
                      },
                      {
                        value: "HIGH",
                        label: "Alta",
                        desc: "Urgente",
                        color: "#dc2626",
                        icon: "ti-flame",
                      },
                    ].map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setForm({ ...form, priority: p.value })}
                        style={{
                          padding: "12px 10px",
                          borderRadius: 10,
                          border: `1.5px solid ${form.priority === p.value ? p.color : t.border}`,
                          background:
                            form.priority === p.value
                              ? `${p.color}12`
                              : t.inputBg,
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.12s",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background:
                              form.priority === p.value
                                ? `${p.color}18`
                                : dark
                                  ? "#1f1f1f"
                                  : "#f3f4f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 6px",
                          }}
                        >
                          <i
                            className={`ti ${p.icon}`}
                            style={{
                              fontSize: 15,
                              color:
                                form.priority === p.value
                                  ? p.color
                                  : t.textMuted,
                            }}
                            aria-hidden="true"
                          />
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color:
                              form.priority === p.value
                                ? p.color
                                : t.textPrimary,
                          }}
                        >
                          {p.label}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: t.textMuted,
                            marginTop: 2,
                          }}
                        >
                          {p.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={lbl}>Anexo (opcional)</label>
                  <div
                    style={{
                      border: `1.5px dashed ${file ? "#16a34a" : t.border}`,
                      borderRadius: 10,
                      textAlign: "center",
                      background: file
                        ? dark
                          ? "rgba(22,163,74,0.05)"
                          : "#f0fdf4"
                        : t.inputBg,
                      transition: "all 0.15s",
                      overflow: "hidden",
                    }}
                  >
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      onChange={(e) => setFile(e.target.files[0])}
                      style={{ display: "none" }}
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      style={{
                        cursor: "pointer",
                        display: "block",
                        padding: "14px",
                      }}
                    >
                      {file ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <i
                            className="ti ti-file-check"
                            style={{ fontSize: 18, color: "#16a34a" }}
                            aria-hidden="true"
                          />
                          <span
                            style={{
                              fontSize: 12,
                              color: "#16a34a",
                              fontWeight: 600,
                            }}
                          >
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFile(null);
                            }}
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              border: "none",
                              color: "#dc2626",
                              cursor: "pointer",
                              fontSize: 12,
                              borderRadius: 6,
                              padding: "2px 8px",
                              fontWeight: 500,
                            }}
                          >
                            remover
                          </button>
                        </div>
                      ) : (
                        <div>
                          <i
                            className="ti ti-cloud-upload"
                            style={{
                              fontSize: 22,
                              color: t.textMuted,
                              display: "block",
                              marginBottom: 5,
                            }}
                            aria-hidden="true"
                          />
                          <span
                            style={{
                              fontSize: 12,
                              color: t.textMuted,
                              fontWeight: 500,
                            }}
                          >
                            Clique para anexar arquivo
                          </span>
                          <div
                            style={{
                              fontSize: 10,
                              color: t.textMuted,
                              marginTop: 3,
                            }}
                          >
                            JPG, PNG, PDF, DOC — máx. 5MB
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 9,
                    }}
                  >
                    <i
                      className="ti ti-alert-circle"
                      style={{ color: "#dc2626", fontSize: 15 }}
                      aria-hidden="true"
                    />
                    <span style={{ fontSize: 12, color: "#dc2626" }}>
                      {error}
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1,
                      padding: "11px",
                      background: t.inputBg,
                      border: `1px solid ${t.border}`,
                      borderRadius: 10,
                      color: t.textSecondary,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontWeight: 500,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = dark
                        ? "#1f1f1f"
                        : "#f3f4f6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = t.inputBg)
                    }
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: "11px",
                      background: submitting
                        ? t.border
                        : "linear-gradient(135deg,#16a34a,#22c55e)",
                      border: "none",
                      borderRadius: 10,
                      color: submitting ? t.textMuted : "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: submitting ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      boxShadow: submitting
                        ? "none"
                        : "0 2px 8px rgba(22,163,74,0.3)",
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                    }}
                  >
                    <i
                      className={`ti ${submitting ? "ti-loader-2 anim-spin" : "ti-send"}`}
                      style={{ fontSize: 14 }}
                      aria-hidden="true"
                    />
                    {submitting ? "Abrindo..." : "Abrir Chamado"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
