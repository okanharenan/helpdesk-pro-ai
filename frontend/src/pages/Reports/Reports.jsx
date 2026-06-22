import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";

const API = import.meta.env.VITE_API_URL;

const STATUS_LABEL = {
  OPEN: "Aberto",
  DOING: "Em andamento",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};
const STATUS_COLOR = {
  OPEN: "#dc2626",
  DOING: "#2563eb",
  RESOLVED: "#16a34a",
  CLOSED: "#6b7280",
};
const STATUS_BG = {
  OPEN: "rgba(239,68,68,0.1)",
  DOING: "rgba(59,130,246,0.1)",
  RESOLVED: "rgba(22,163,74,0.1)",
  CLOSED: "rgba(107,114,128,0.1)",
};
const PRIORITY_LABEL = { HIGH: "Alta", MEDIUM: "Média", LOW: "Baixa" };
const PRIORITY_COLOR = { HIGH: "#dc2626", MEDIUM: "#d97706", LOW: "#6b7280" };
const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function useCountUp(target, duration = 1000, active = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || target === 0) {
      setVal(target);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active]);
  return val;
}

function AnimNum({ value, active, suffix = "", prefix = "" }) {
  const v = useCountUp(value, 1000, active);
  return (
    <>
      {prefix}
      {v}
      {suffix}
    </>
  );
}

function Sk({ w = "100%", h = 14, dark, r = 6 }) {
  return (
    <div
      className={dark ? "skeleton" : "skeleton-light"}
      style={{ height: h, width: w, borderRadius: r }}
    />
  );
}

// Donut SVG animado
function DonutChart({ segments, size = 120, stroke = 14, animated }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={stroke}
      />
      {segments.map((s, i) => {
        const dash = animated ? (s.pct / 100) * circ : 0;
        const currentOffset = -offset;
        offset += (s.pct / 100) * circ;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${animated ? dash : 0} ${circ}`}
            strokeDashoffset={currentOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: `stroke-dasharray 1.2s cubic-bezier(.34,1.2,.64,1) ${0.1 + i * 0.2}s`,
            }}
          />
        );
      })}
    </svg>
  );
}

// Gráfico de linha SVG
function LineChart({ data, color, height = 80, animated }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 300;
  const h = height;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (v / max) * (h - 10) - 5,
  }));
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id="chartClip">
          <rect
            x="0"
            y="0"
            width={animated ? w : 0}
            height={h}
            style={{ transition: "width 1.4s cubic-bezier(.4,0,.2,1) 0.3s" }}
          />
        </clipPath>
      </defs>
      <path d={area} fill="url(#areaGrad)" clipPath="url(#chartClip)" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath="url(#chartClip)"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={color}
          style={{
            opacity: animated ? 1 : 0,
            transition: `opacity 0.3s ease ${0.5 + i * 0.05}s`,
          }}
        />
      ))}
    </svg>
  );
}

export default function Reports() {
  const t = useThemeColors();
  const { dark } = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [exporting, setExporting] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const token = localStorage.getItem("helpdesk_token");

  useEffect(() => {
    axios
      .get(`${API}/tickets`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setTickets(res.data);
        setTimeout(() => setAnimated(true), 300);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setAnimated(false);
    setTimeout(() => setAnimated(true), 200);
  }, [period]);

  const now = new Date();
  const periodDays =
    period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const filtered = tickets.filter(
    (tk) => (now - new Date(tk.createdAt)) / 86400000 <= periodDays,
  );

  const total = filtered.length;
  const open = filtered.filter((t) => t.status === "OPEN").length;
  const doing = filtered.filter((t) => t.status === "DOING").length;
  const resolved = filtered.filter((t) => t.status === "RESOLVED").length;
  const closed = filtered.filter((t) => t.status === "CLOSED").length;
  const urgent = filtered.filter((t) => t.priority === "HIGH").length;
  const resRate =
    total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0;

  const byStatus = ["OPEN", "DOING", "RESOLVED", "CLOSED"].map((s) => ({
    label: STATUS_LABEL[s],
    color: STATUS_COLOR[s],
    bg: STATUS_BG[s],
    count: filtered.filter((t) => t.status === s).length,
    pct:
      total > 0
        ? Math.round(
            (filtered.filter((t) => t.status === s).length / total) * 100,
          )
        : 0,
  }));

  const byPriority = ["HIGH", "MEDIUM", "LOW"].map((p) => ({
    label: PRIORITY_LABEL[p],
    color: PRIORITY_COLOR[p],
    count: filtered.filter((t) => t.priority === p).length,
    pct:
      total > 0
        ? Math.round(
            (filtered.filter((t) => t.priority === p).length / total) * 100,
          )
        : 0,
  }));

  const buildTimeline = () => {
    if (periodDays <= 30) {
      return Array.from({ length: periodDays }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (periodDays - 1 - i));
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        const count = filtered.filter((tk) => {
          const cd = new Date(tk.createdAt);
          return (
            cd.getDate() === d.getDate() &&
            cd.getMonth() === d.getMonth() &&
            cd.getFullYear() === d.getFullYear()
          );
        }).length;
        return { label, count };
      });
    }
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const count = filtered.filter((tk) => {
        const cd = new Date(tk.createdAt);
        return (
          cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear()
        );
      }).length;
      return { label: MONTHS[d.getMonth()], count };
    });
  };
  const timeline = buildTimeline();
  const maxTL = Math.max(...timeline.map((d) => d.count), 1);
  const lineData = timeline.map((d) => d.count);

  const agentMap = {};
  filtered.forEach((tk) => {
    if (!tk.user) return;
    if (!agentMap[tk.user.id])
      agentMap[tk.user.id] = { name: tk.user.name, total: 0, resolved: 0 };
    agentMap[tk.user.id].total++;
    if (tk.status === "RESOLVED" || tk.status === "CLOSED")
      agentMap[tk.user.id].resolved++;
  });
  const agents = Object.values(agentMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
  const maxAgent = Math.max(...agents.map((a) => a.total), 1);

  const exportCSV = () => {
    setExporting(true);
    try {
      const header = [
        "ID",
        "Título",
        "Status",
        "Prioridade",
        "Solicitante",
        "Data",
      ];
      const rows = filtered.map((tk) => [
        tk.id,
        `"${tk.title}"`,
        STATUS_LABEL[tk.status] || tk.status,
        PRIORITY_LABEL[tk.priority] || tk.priority,
        tk.user?.name || "",
        new Date(tk.createdAt).toLocaleDateString("pt-BR"),
      ]);
      const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(
        new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }),
      );
      a.download = `helpdesk-${period}.csv`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  const card = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 14,
    boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
  };
  const PERIODS = [
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "90d", label: "3 meses" },
    { key: "1y", label: "1 ano" },
  ];
  const TABS = [
    { key: "overview", label: "Visão geral", icon: "ti-layout-dashboard" },
    { key: "status", label: "Status", icon: "ti-chart-donut" },
    { key: "agents", label: "Usuários", icon: "ti-users" },
    { key: "list", label: "Listagem", icon: "ti-list" },
  ];

  const donutSegs = [
    {
      color: "#16a34a",
      pct: total > 0 ? Math.round((resolved / total) * 100) : 0,
    },
    {
      color: "#2563eb",
      pct: total > 0 ? Math.round((doing / total) * 100) : 0,
    },
    { color: "#f59e0b", pct: total > 0 ? Math.round((open / total) * 100) : 0 },
    {
      color: "#6b7280",
      pct: total > 0 ? Math.round((closed / total) * 100) : 0,
    },
  ];

  const kpis = [
    {
      label: "Total no período",
      value: total,
      accent: "#16a34a",
      iconBg: dark ? "rgba(22,163,74,0.15)" : "#f0fdf4",
      icon: "ti-ticket",
      iconColor: "#16a34a",
      trend: `últimos ${periodDays}d`,
      trendBg: dark ? "rgba(22,163,74,0.12)" : "#f0fdf4",
      trendColor: "#166534",
    },
    {
      label: "Taxa de resolução",
      value: resRate,
      suffix: "%",
      accent: "#2563eb",
      iconBg: dark ? "rgba(59,130,246,0.15)" : "#eff6ff",
      icon: "ti-circle-check",
      iconColor: "#2563eb",
      trend: `${resolved + closed} resolvidos`,
      trendBg: dark ? "rgba(59,130,246,0.12)" : "#eff6ff",
      trendColor: "#1e40af",
    },
    {
      label: "Tickets urgentes",
      value: urgent,
      accent: "#dc2626",
      iconBg: dark ? "rgba(239,68,68,0.15)" : "#fff5f5",
      icon: "ti-alert-triangle",
      iconColor: "#dc2626",
      trend: "prioridade alta",
      trendBg: dark ? "rgba(239,68,68,0.12)" : "#fff5f5",
      trendColor: "#991b1b",
    },
    {
      label: "Em andamento",
      value: doing,
      accent: "#d97706",
      iconBg: dark ? "rgba(217,119,6,0.15)" : "#fff7ed",
      icon: "ti-loader",
      iconColor: "#d97706",
      trend: "ativos agora",
      trendBg: dark ? "rgba(217,119,6,0.12)" : "#fff7ed",
      trendColor: "#9a3412",
    },
  ];

  const aColors = [
    "#16a34a",
    "#2563eb",
    "#d97706",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
    "#db2777",
    "#65a30d",
  ];

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
          title="Relatórios"
          subtitle="análise e performance do helpdesk"
        />

        <div
          className="anim-fade"
          style={{ padding: 20, overflowY: "auto", flex: 1 }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <div
                style={{ fontSize: 20, fontWeight: 700, color: t.textPrimary }}
              >
                Relatório de Atendimento
              </div>
              <div style={{ fontSize: 13, color: t.textMuted, marginTop: 3 }}>
                {now.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  background: dark ? "#1a1a1a" : "#f1f5f9",
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: 3,
                  gap: 2,
                }}
              >
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    style={{
                      padding: "6px 13px",
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: period === p.key ? 600 : 400,
                      background: period === p.key ? t.cardBg : "transparent",
                      border: "none",
                      color: period === p.key ? t.textPrimary : t.textMuted,
                      boxShadow:
                        period === p.key
                          ? dark
                            ? "none"
                            : "0 1px 3px rgba(0,0,0,0.08)"
                          : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                onClick={exportCSV}
                disabled={exporting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 14px",
                  background: "linear-gradient(135deg,#16a34a,#22c55e)",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
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
                    "0 2px 8px rgba(22,163,74,0.25)";
                }}
              >
                <i
                  className="ti ti-download"
                  style={{ fontSize: 14 }}
                  aria-hidden="true"
                />
                {exporting ? "Exportando..." : "Exportar CSV"}
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 12,
              marginBottom: 14,
            }}
          >
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ ...card, padding: 16 }}>
                    <Sk w={36} h={36} dark={dark} r={9} />
                    <div style={{ marginTop: 12, marginBottom: 8 }}>
                      <Sk w={90} h={11} dark={dark} />
                    </div>
                    <Sk w={60} h={28} dark={dark} />
                    <div style={{ marginTop: 8 }}>
                      <Sk w={80} h={20} dark={dark} r={99} />
                    </div>
                  </div>
                ))
              : kpis.map((m, i) => (
                  <div
                    key={m.label}
                    className={`hover-lift anim-fade anim-d${i + 1}`}
                    style={{
                      ...card,
                      padding: 16,
                      position: "relative",
                      overflow: "hidden",
                      cursor: "default",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: `linear-gradient(90deg,${m.accent},${m.accent}44)`,
                        borderRadius: "14px 14px 0 0",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: -24,
                        right: -24,
                        width: 90,
                        height: 90,
                        borderRadius: "50%",
                        background: m.accent,
                        opacity: 0.06,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: m.iconBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i
                          className={`ti ${m.icon}`}
                          style={{ fontSize: 19, color: m.iconColor }}
                          aria-hidden="true"
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "3px 9px",
                          borderRadius: 99,
                          background: m.trendBg,
                          color: m.trendColor,
                          fontWeight: 600,
                        }}
                      >
                        {m.trend}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: t.textMuted,
                        fontWeight: 500,
                        marginBottom: 6,
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color: t.textPrimary,
                        lineHeight: 1,
                      }}
                    >
                      <AnimNum
                        value={m.value}
                        active={animated}
                        suffix={m.suffix || ""}
                      />
                    </div>
                  </div>
                ))}
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 16,
              background: dark ? "#1a1a1a" : "#f1f5f9",
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: 4,
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "9px 10px",
                  borderRadius: 9,
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  background: activeTab === tab.key ? t.cardBg : "transparent",
                  border: "none",
                  color: activeTab === tab.key ? t.textPrimary : t.textMuted,
                  boxShadow:
                    activeTab === tab.key
                      ? dark
                        ? "none"
                        : "0 1px 3px rgba(0,0,0,0.08)"
                      : "none",
                  transition: "all 0.15s",
                }}
              >
                <i
                  className={`ti ${tab.icon}`}
                  style={{
                    fontSize: 15,
                    color: activeTab === tab.key ? "#16a34a" : t.textMuted,
                  }}
                  aria-hidden="true"
                />
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB: Overview */}
          {activeTab === "overview" && (
            <div className="anim-fade">
              {/* Gráfico de linha + Donut */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div style={{ ...card, padding: "18px 20px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: t.textPrimary,
                        }}
                      >
                        Volume de tickets
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: t.textMuted,
                          marginTop: 2,
                        }}
                      >
                        Chamados abertos ao longo do tempo
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "4px 12px",
                        borderRadius: 99,
                        background: dark ? "rgba(22,163,74,0.12)" : "#f0fdf4",
                        color: "#16a34a",
                        fontWeight: 600,
                        border: `1px solid ${dark ? "rgba(22,163,74,0.2)" : "#bbf7d0"}`,
                      }}
                    >
                      {total} total
                    </span>
                  </div>
                  {loading ? (
                    <Sk h={90} dark={dark} r={8} />
                  ) : (
                    <div style={{ position: "relative" }}>
                      <LineChart
                        data={lineData}
                        color="#16a34a"
                        height={90}
                        animated={animated}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: 8,
                        }}
                      >
                        {timeline
                          .filter(
                            (_, i) =>
                              periodDays <= 7 ||
                              (periodDays <= 30 && i % 5 === 0) ||
                              periodDays > 30,
                          )
                          .map((d, i) => (
                            <span
                              key={i}
                              style={{ fontSize: 9, color: t.textMuted }}
                            >
                              {d.label}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ ...card, padding: "18px 20px" }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: t.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    Distribuição
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: t.textMuted,
                      marginBottom: 16,
                    }}
                  >
                    Por status atual
                  </div>
                  {loading ? (
                    <Sk h={120} dark={dark} r={8} />
                  ) : (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <div style={{ position: "relative" }}>
                        <DonutChart
                          segments={donutSegs}
                          size={100}
                          stroke={12}
                          animated={animated}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: t.textPrimary,
                            }}
                          >
                            <AnimNum
                              value={resRate}
                              active={animated}
                              suffix="%"
                            />
                          </span>
                          <span style={{ fontSize: 9, color: t.textMuted }}>
                            resolvidos
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {[
                          {
                            label: "Resolvidos",
                            count: resolved,
                            color: "#16a34a",
                          },
                          {
                            label: "Andamento",
                            count: doing,
                            color: "#2563eb",
                          },
                          { label: "Abertos", count: open, color: "#f59e0b" },
                          {
                            label: "Fechados",
                            count: closed,
                            color: "#6b7280",
                          },
                        ].map((s) => (
                          <div
                            key={s.label}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: s.color,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 11,
                                color: t.textSecondary,
                                flex: 1,
                              }}
                            >
                              {s.label}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: t.textPrimary,
                              }}
                            >
                              {s.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Barras timeline */}
              <div style={{ ...card, padding: "18px 20px", marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: t.textPrimary,
                      }}
                    >
                      Tickets por período
                    </div>
                    <div
                      style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}
                    >
                      Distribuição temporal com barras animadas
                    </div>
                  </div>
                </div>
                {loading ? (
                  <Sk h={130} dark={dark} r={8} />
                ) : (
                  <div style={{ overflowX: "auto", paddingBottom: 4 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: periodDays <= 30 ? 3 : 6,
                        height: 130,
                        minWidth: periodDays <= 30 ? "100%" : "auto",
                        paddingTop: 20,
                      }}
                    >
                      {timeline.map((d, i) => {
                        const barH = animated
                          ? Math.max(
                              Math.round((d.count / maxTL) * 105),
                              d.count > 0 ? 10 : 2,
                            )
                          : 2;
                        const intensity = d.count / maxTL;
                        const grad =
                          d.count === 0
                            ? t.border
                            : intensity > 0.7
                              ? "linear-gradient(180deg,#16a34a,#22c55e)"
                              : intensity > 0.4
                                ? "linear-gradient(180deg,#22c55e,#4ade80)"
                                : "linear-gradient(180deg,#4ade80,#bbf7d0)";
                        const showLabel =
                          periodDays <= 7 ||
                          (periodDays === 30 && i % 5 === 0) ||
                          (periodDays === 90 && i % 5 === 0) ||
                          periodDays > 90;
                        return (
                          <div
                            key={i}
                            title={`${d.label}: ${d.count}`}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 5,
                              flex: periodDays <= 30 ? 1 : "0 0 40px",
                              width: periodDays > 30 ? 40 : "auto",
                              position: "relative",
                            }}
                          >
                            {d.count > 0 && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: -18,
                                  fontSize: 9,
                                  color: t.textMuted,
                                  fontWeight: 600,
                                }}
                              >
                                {d.count}
                              </span>
                            )}
                            <div
                              style={{
                                width: periodDays <= 30 ? "70%" : "28px",
                                height: barH,
                                background: grad,
                                borderRadius: "4px 4px 0 0",
                                transition:
                                  "height 0.9s cubic-bezier(.34,1.56,.64,1)",
                                minHeight: 2,
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = "0.75";
                                e.currentTarget.style.transform =
                                  "scaleX(1.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = "1";
                                e.currentTarget.style.transform = "scaleX(1)";
                              }}
                            />
                            {showLabel && (
                              <span
                                style={{
                                  fontSize: 9,
                                  color: t.textMuted,
                                  fontWeight: 500,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {d.label}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Status */}
          {activeTab === "status" && (
            <div className="anim-fade">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div style={{ ...card, padding: "18px 20px" }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: t.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    Por status
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: t.textMuted,
                      marginBottom: 18,
                    }}
                  >
                    Chamados por situação atual
                  </div>
                  {loading ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <Sk key={i} h={36} dark={dark} r={8} />
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {byStatus.map((s) => (
                        <div key={s.label}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 7,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  width: 9,
                                  height: 9,
                                  borderRadius: "50%",
                                  background: s.color,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 13,
                                  color: t.textSecondary,
                                  fontWeight: 500,
                                }}
                              >
                                {s.label}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: t.textPrimary,
                                }}
                              >
                                {s.count}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: "2px 9px",
                                  borderRadius: 99,
                                  background: s.bg,
                                  color: s.color,
                                  fontWeight: 600,
                                }}
                              >
                                {s.pct}%
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              height: 10,
                              background: dark ? "#1f1f1f" : "#f1f5f9",
                              borderRadius: 99,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: 99,
                                background: s.color,
                                width: animated ? `${s.pct}%` : "0%",
                                transition:
                                  "width 1s cubic-bezier(.34,1.2,.64,1)",
                                boxShadow: `0 0 8px ${s.color}40`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ ...card, padding: "18px 20px" }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: t.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    Por prioridade
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: t.textMuted,
                      marginBottom: 18,
                    }}
                  >
                    Distribuição por urgência
                  </div>
                  {loading ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      {[1, 2, 3].map((i) => (
                        <Sk key={i} h={36} dark={dark} r={8} />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 16,
                          marginBottom: 20,
                        }}
                      >
                        {byPriority.map((p) => (
                          <div key={p.label}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 7,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 9,
                                    height: 9,
                                    borderRadius: "50%",
                                    background: p.color,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 13,
                                    color: t.textSecondary,
                                    fontWeight: 500,
                                  }}
                                >
                                  {p.label}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: t.textPrimary,
                                  }}
                                >
                                  {p.count}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    padding: "2px 9px",
                                    borderRadius: 99,
                                    background: `${p.color}15`,
                                    color: p.color,
                                    fontWeight: 600,
                                  }}
                                >
                                  {p.pct}%
                                </span>
                              </div>
                            </div>
                            <div
                              style={{
                                height: 10,
                                background: dark ? "#1f1f1f" : "#f1f5f9",
                                borderRadius: 99,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  borderRadius: 99,
                                  background: p.color,
                                  width: animated ? `${p.pct}%` : "0%",
                                  transition:
                                    "width 1s cubic-bezier(.34,1.2,.64,1)",
                                  boxShadow: `0 0 8px ${p.color}40`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          borderTop: `1px solid ${t.border}`,
                          paddingTop: 16,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 10,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: t.textMuted,
                              fontWeight: 500,
                            }}
                          >
                            Taxa de resolução geral
                          </span>
                          <span
                            style={{
                              fontSize: 22,
                              fontWeight: 700,
                              color:
                                resRate >= 70
                                  ? "#16a34a"
                                  : resRate >= 40
                                    ? "#d97706"
                                    : "#dc2626",
                            }}
                          >
                            <AnimNum
                              value={resRate}
                              active={animated}
                              suffix="%"
                            />
                          </span>
                        </div>
                        <div
                          style={{
                            height: 14,
                            background: dark ? "#1f1f1f" : "#f1f5f9",
                            borderRadius: 99,
                            overflow: "hidden",
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              borderRadius: 99,
                              width: animated ? `${resRate}%` : "0%",
                              transition:
                                "width 1.2s cubic-bezier(.34,1.2,.64,1)",
                              background:
                                resRate >= 70
                                  ? "linear-gradient(90deg,#16a34a,#22c55e)"
                                  : resRate >= 40
                                    ? "linear-gradient(90deg,#d97706,#fbbf24)"
                                    : "linear-gradient(90deg,#dc2626,#f87171)",
                              boxShadow:
                                resRate >= 70
                                  ? "0 0 12px rgba(22,163,74,0.4)"
                                  : resRate >= 40
                                    ? "0 0 12px rgba(217,119,6,0.4)"
                                    : "0 0 12px rgba(220,38,38,0.4)",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            padding: "5px 14px",
                            borderRadius: 99,
                            fontWeight: 600,
                            background:
                              resRate >= 70
                                ? "rgba(22,163,74,0.1)"
                                : resRate >= 40
                                  ? "rgba(217,119,6,0.08)"
                                  : "rgba(239,68,68,0.08)",
                            color:
                              resRate >= 70
                                ? "#16a34a"
                                : resRate >= 40
                                  ? "#d97706"
                                  : "#dc2626",
                          }}
                        >
                          <i
                            className={
                              resRate >= 70
                                ? "ti ti-check"
                                : resRate >= 40
                                  ? "ti ti-alert-triangle"
                                  : "ti ti-x"
                            }
                            style={{ fontSize: 13 }}
                            aria-hidden="true"
                          />
                          {resRate >= 70
                            ? "Excelente desempenho"
                            : resRate >= 40
                              ? "Desempenho moderado"
                              : "Necessita atenção"}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Agentes */}
          {activeTab === "agents" && (
            <div className="anim-fade">
              <div style={{ ...card, padding: "18px 20px", marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: t.textPrimary,
                      }}
                    >
                      Performance por usuário
                    </div>
                    <div
                      style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}
                    >
                      Volume e taxa de resolução por pessoa
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                      border: `1px solid ${t.border}`,
                      color: t.textMuted,
                      fontWeight: 500,
                    }}
                  >
                    {agents.length} usuário{agents.length !== 1 ? "s" : ""} no
                    período
                  </span>
                </div>
                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {[1, 2, 3, 4].map((i) => (
                      <Sk key={i} h={56} dark={dark} r={10} />
                    ))}
                  </div>
                ) : agents.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 0",
                      color: t.textMuted,
                    }}
                  >
                    <i
                      className="ti ti-users-off"
                      style={{
                        fontSize: 32,
                        display: "block",
                        marginBottom: 10,
                      }}
                      aria-hidden="true"
                    />
                    <div style={{ fontSize: 14 }}>Nenhum dado no período</div>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "36px 1fr 80px 90px 100px 1fr",
                        gap: 12,
                        padding: "0 12px 12px",
                        fontSize: 11,
                        color: t.textMuted,
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                        borderBottom: `1px solid ${t.border}`,
                        marginBottom: 6,
                      }}
                    >
                      <span>#</span>
                      <span>Usuário</span>
                      <span>Total</span>
                      <span>Resolvidos</span>
                      <span>Taxa</span>
                      <span>Volume</span>
                    </div>
                    {agents.map((a, i) => {
                      const rate =
                        a.total > 0
                          ? Math.round((a.resolved / a.total) * 100)
                          : 0;
                      const barPct = Math.round((a.total / maxAgent) * 100);
                      const initials = a.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();
                      const aColor = aColors[i % aColors.length];
                      return (
                        <div
                          key={a.name}
                          className={`anim-fade anim-d${Math.min(i + 1, 5)}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "36px 1fr 80px 90px 100px 1fr",
                            gap: 12,
                            padding: "12px",
                            borderBottom: `1px solid ${t.borderLight}`,
                            alignItems: "center",
                            transition: "background 0.12s",
                            borderRadius: 8,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = t.rowHover)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              background: `${aColor}15`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 700,
                              color: aColor,
                            }}
                          >
                            {i + 1}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                background: `${aColor}15`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                color: aColor,
                                flexShrink: 0,
                                boxShadow: `0 0 0 1px ${aColor}30`,
                              }}
                            >
                              {initials}
                            </div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: t.textPrimary,
                              }}
                            >
                              {a.name}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: t.textPrimary,
                            }}
                          >
                            {a.total}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              color: "#16a34a",
                              fontWeight: 600,
                            }}
                          >
                            {a.resolved}
                          </span>
                          <span>
                            <span
                              style={{
                                fontSize: 12,
                                padding: "3px 10px",
                                borderRadius: 99,
                                fontWeight: 600,
                                background:
                                  rate >= 70
                                    ? "rgba(22,163,74,0.1)"
                                    : rate >= 40
                                      ? "rgba(217,119,6,0.08)"
                                      : "rgba(239,68,68,0.08)",
                                color:
                                  rate >= 70
                                    ? "#16a34a"
                                    : rate >= 40
                                      ? "#d97706"
                                      : "#dc2626",
                              }}
                            >
                              {rate}%
                            </span>
                          </span>
                          <div
                            style={{
                              height: 8,
                              background: dark ? "#1f1f1f" : "#f1f5f9",
                              borderRadius: 99,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: 99,
                                background: aColor,
                                width: animated ? `${barPct}%` : "0%",
                                transition:
                                  "width 1s cubic-bezier(.34,1.2,.64,1)",
                                boxShadow: `0 0 8px ${aColor}40`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Listagem */}
          {activeTab === "list" && (
            <div className="anim-fade">
              <div style={{ ...card, overflow: "hidden" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: t.textPrimary,
                      }}
                    >
                      Todos os tickets do período
                    </div>
                    <div
                      style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}
                    >
                      Listagem completa com detalhes
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        padding: "4px 12px",
                        borderRadius: 99,
                        background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                        border: `1px solid ${t.border}`,
                        color: t.textMuted,
                        fontWeight: 500,
                      }}
                    >
                      {filtered.length} registros
                    </span>
                    <button
                      onClick={exportCSV}
                      disabled={exporting}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        background: dark ? "rgba(22,163,74,0.1)" : "#f0fdf4",
                        border: `1px solid ${dark ? "rgba(22,163,74,0.2)" : "#bbf7d0"}`,
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#16a34a",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <i
                        className="ti ti-download"
                        style={{ fontSize: 13 }}
                        aria-hidden="true"
                      />
                      CSV
                    </button>
                  </div>
                </div>
                {loading ? (
                  <div
                    style={{
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Sk key={i} h={44} dark={dark} r={8} />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 0",
                      color: t.textMuted,
                      fontSize: 13,
                    }}
                  >
                    <i
                      className="ti ti-inbox-off"
                      style={{
                        fontSize: 32,
                        display: "block",
                        marginBottom: 10,
                      }}
                      aria-hidden="true"
                    />
                    Nenhum ticket no período selecionado
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 13,
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: dark
                              ? "rgba(255,255,255,0.03)"
                              : "#f8fafc",
                          }}
                        >
                          {[
                            "ID",
                            "Título",
                            "Status",
                            "Prioridade",
                            "Solicitante",
                            "Data",
                          ].map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "11px 14px",
                                textAlign: "left",
                                fontSize: 11,
                                fontWeight: 600,
                                color: t.textMuted,
                                borderBottom: `1px solid ${t.border}`,
                                letterSpacing: "0.02em",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.slice(0, 50).map((tk, i) => (
                          <tr
                            key={tk.id}
                            className={`anim-fade anim-d${Math.min(i + 1, 5)}`}
                            style={{
                              borderBottom: `1px solid ${t.borderLight}`,
                              transition: "background 0.12s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = t.rowHover)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <td
                              style={{
                                padding: "12px 14px",
                                color: t.textMuted,
                                fontWeight: 600,
                              }}
                            >
                              #{tk.id}
                            </td>
                            <td
                              style={{
                                padding: "12px 14px",
                                color: t.textPrimary,
                                fontWeight: 500,
                                maxWidth: 260,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {tk.title}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: "4px 10px",
                                  borderRadius: 99,
                                  fontWeight: 500,
                                  background: STATUS_BG[tk.status],
                                  color: STATUS_COLOR[tk.status],
                                }}
                              >
                                {STATUS_LABEL[tk.status]}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: "4px 10px",
                                  borderRadius: 99,
                                  fontWeight: 500,
                                  background: `${PRIORITY_COLOR[tk.priority]}15`,
                                  color: PRIORITY_COLOR[tk.priority],
                                }}
                              >
                                {PRIORITY_LABEL[tk.priority]}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 14px",
                                color: t.textSecondary,
                              }}
                            >
                              {tk.user?.name || "—"}
                            </td>
                            <td
                              style={{
                                padding: "12px 14px",
                                color: t.textMuted,
                              }}
                            >
                              {new Date(tk.createdAt).toLocaleDateString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtered.length > 50 && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "14px 0",
                          fontSize: 12,
                          color: t.textMuted,
                          borderTop: `1px solid ${t.border}`,
                        }}
                      >
                        Mostrando 50 de {filtered.length} registros — exporte o
                        CSV para ver todos
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
