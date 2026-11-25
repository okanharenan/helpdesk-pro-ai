import { useState, useEffect } from "react";
import axios from "axios";
import { useMe } from "../../contexts/MeContext";

const API = import.meta.env.VITE_API_URL;

const MODES = [
  {
    key: "SUPERADMIN",
    icon: "ti-shield-check",
    title: "Sempre o SUPERADMIN",
    desc: "Todo ticket novo vai para o SUPERADMIN, que depois repassa para quem for atender.",
  },
  {
    key: "ROUND_ROBIN",
    icon: "ti-arrows-shuffle",
    title: "Rodízio entre os agentes",
    desc: "Cada ticket novo vai para o próximo agente da fila, em ordem. Todos recebem a mesma quantidade.",
  },
  {
    key: "LEAST_LOADED",
    icon: "ti-scale",
    title: "Menor carga primeiro",
    desc: "O ticket vai para o agente com menos tickets abertos ou em andamento no momento.",
  },
];

function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 99,
        background: checked ? "#16a34a" : "#d1d5db",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

export default function AssignmentSettings({ t, dark }) {
  const { me } = useMe() || {};
  const canChangeMode = me?.role === "SUPERADMIN";
  const token = localStorage.getItem("helpdesk_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingMode, setSavingMode] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [msg, setMsg] = useState(null);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  useEffect(() => {
    axios
      .get(`${API}/assignment/settings`, { headers })
      .then((res) => setData(res.data))
      .catch(() => flash("error", "Não foi possível carregar a distribuição."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMode = async (mode) => {
    if (!canChangeMode || savingMode || mode === data.mode) return;
    const previous = data.mode;
    setData((d) => ({ ...d, mode }));
    setSavingMode(true);
    try {
      await axios.patch(`${API}/assignment/settings`, { mode }, { headers });
      flash("ok", "Modo de distribuição atualizado.");
    } catch (err) {
      setData((d) => ({ ...d, mode: previous }));
      flash("error", err.response?.data?.message || "Não foi possível salvar o modo.");
    } finally {
      setSavingMode(false);
    }
  };

  const handleAvailability = async (user, available) => {
    setTogglingId(user.id);
    setData((d) => ({
      ...d,
      team: d.team.map((u) => (u.id === user.id ? { ...u, available } : u)),
    }));
    try {
      await axios.patch(`${API}/assignment/availability/${user.id}`, { available }, { headers });
    } catch (err) {
      setData((d) => ({
        ...d,
        team: d.team.map((u) => (u.id === user.id ? { ...u, available: !available } : u)),
      }));
      flash("error", err.response?.data?.message || "Não foi possível alterar a disponibilidade.");
    } finally {
      setTogglingId(null);
    }
  };

  const card = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 14,
    boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
    padding: 20,
    marginBottom: 16,
  };

  if (loading) {
    return <div style={{ ...card, color: t.textMuted, fontSize: 13 }}>Carregando...</div>;
  }
  if (!data) {
    return <div style={{ ...card, color: "#dc2626", fontSize: 13 }}>Não foi possível carregar a distribuição.</div>;
  }

  const team = data.team;
  const available = team.filter((u) => u.available);
  const autoOn = data.mode !== "SUPERADMIN";

  // Quem seria escolhido agora (só para mostrar um selo na lista)
  let nextId = null;
  if (available.length) {
    if (data.mode === "ROUND_ROBIN") {
      nextId = (available.find((u) => u.id > (data.lastAssignedId ?? 0)) || available[0]).id;
    } else if (data.mode === "LEAST_LOADED") {
      const min = Math.min(...available.map((u) => u.openTickets));
      const tied = available.filter((u) => u.openTickets === min);
      nextId = (tied.find((u) => u.id > (data.lastAssignedId ?? 0)) || tied[0]).id;
    }
  }

  return (
    <div className="anim-fade">
      {msg && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 500,
            background: msg.type === "ok" ? (dark ? "rgba(22,163,74,0.12)" : "#f0fdf4") : dark ? "rgba(220,38,38,0.12)" : "#fef2f2",
            color: msg.type === "ok" ? "#16a34a" : "#dc2626",
            border: `1px solid ${msg.type === "ok" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
          }}
        >
          <i className={`ti ${msg.type === "ok" ? "ti-circle-check" : "ti-alert-circle"}`} style={{ fontSize: 15 }} aria-hidden="true" />
          {msg.text}
        </div>
      )}

      {/* Modo de distribuição */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.textPrimary, marginBottom: 4 }}>
          Como distribuir os tickets novos
        </div>
        <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>
          Vale para todo ticket criado a partir de agora. Os que já existem não mudam de responsável.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {MODES.map((m) => {
            const selected = data.mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => handleMode(m.key)}
                disabled={!canChangeMode || savingMode}
                aria-pressed={selected}
                style={{
                  textAlign: "left",
                  padding: 14,
                  borderRadius: 12,
                  cursor: canChangeMode ? "pointer" : "default",
                  fontFamily: "inherit",
                  background: selected ? (dark ? "rgba(22,163,74,0.08)" : "#f0fdf4") : "transparent",
                  border: `2px solid ${selected ? "#16a34a" : t.border}`,
                  opacity: savingMode && !selected ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <i className={`ti ${m.icon}`} style={{ fontSize: 18, color: selected ? "#16a34a" : t.textMuted }} aria-hidden="true" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, flex: 1 }}>{m.title}</span>
                  {selected && <i className="ti ti-circle-check" style={{ fontSize: 16, color: "#16a34a" }} aria-hidden="true" />}
                </div>
                <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>{m.desc}</div>
              </button>
            );
          })}
        </div>

        {!canChangeMode && (
          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 12 }}>
            Só o SUPERADMIN altera o modo de distribuição.
          </div>
        )}
      </div>

      {/* Equipe */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.textPrimary }}>Equipe na distribuição</div>
          <span style={{ fontSize: 11, color: t.textMuted }}>
            {available.length} de {team.length} disponíve{available.length === 1 ? "l" : "is"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 14 }}>
          Só agentes ativos e marcados como disponíveis recebem tickets automaticamente. Quem está ausente fica fora da fila.
        </div>

        {autoOn && team.length > 0 && available.length === 0 && (
          <div
            role="alert"
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              marginBottom: 14,
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 12,
              background: dark ? "rgba(217,119,6,0.12)" : "#fffbeb",
              color: "#b45309",
              border: "1px solid rgba(217,119,6,0.3)",
            }}
          >
            <i className="ti ti-alert-triangle" style={{ fontSize: 15, marginTop: 1 }} aria-hidden="true" />
            Nenhum agente disponível agora: os tickets novos vão para o SUPERADMIN até alguém ficar disponível.
          </div>
        )}

        {team.length === 0 ? (
          <div style={{ fontSize: 12, color: t.textMuted, padding: "12px 0" }}>
            Nenhum agente ativo cadastrado. Crie usuários com a role Agente em "Gerenciar usuários" para usar a distribuição.
          </div>
        ) : (
          team.map((u, i) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderTop: i === 0 ? `1px solid ${t.border}` : "none",
                borderBottom: `1px solid ${t.border}`,
                opacity: u.available ? 1 : 0.65,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: dark ? "rgba(217,119,6,0.15)" : "rgba(217,119,6,0.1)",
                  color: "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>{u.name}</span>
                  {autoOn && u.id === nextId && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: dark ? "rgba(22,163,74,0.15)" : "#dcfce7", color: "#16a34a" }}>
                      {data.mode === "ROUND_ROBIN" ? "Próximo da fila" : "Menor carga"}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: t.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.email}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: t.textSecondary,
                  background: dark ? "#1f1f1f" : "#f3f4f6",
                  padding: "3px 10px",
                  borderRadius: 99,
                  whiteSpace: "nowrap",
                }}
              >
                {u.openTickets} aberto{u.openTickets === 1 ? "" : "s"}
              </span>
              <span style={{ fontSize: 11, color: u.available ? "#16a34a" : t.textMuted, fontWeight: 500, width: 62, textAlign: "right" }}>
                {u.available ? "Disponível" : "Ausente"}
              </span>
              <Switch
                checked={u.available}
                disabled={togglingId === u.id}
                onChange={(v) => handleAvailability(u, v)}
                label={`Disponibilidade de ${u.name}`}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}