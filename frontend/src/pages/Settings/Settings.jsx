import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";
import { useMe } from "../../contexts/MeContext";

const API = import.meta.env.VITE_API_URL;

const ROLE_META = {
  ADMIN: {
    label: "Admin",
    color: "#2563eb",
    bg: "rgba(59,130,246,0.1)",
    icon: "ti-user-check",
  },
  AGENT: {
    label: "Agente",
    color: "#d97706",
    bg: "rgba(217,119,6,0.1)",
    icon: "ti-headset",
  },
  CLIENT: {
    label: "Cliente",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.1)",
    icon: "ti-user",
  },
};

const PERM_META = [
  {
    key: "canViewAllTickets",
    label: "Ver todos os tickets",
    desc: "Acesso à lista completa de chamados",
    icon: "ti-eye",
    group: "Tickets",
  },
  {
    key: "canCreateTicket",
    label: "Abrir tickets",
    desc: "Criar novos chamados de suporte",
    icon: "ti-plus",
    group: "Tickets",
  },
  {
    key: "canEditTicket",
    label: "Editar tickets",
    desc: "Modificar título e descrição de chamados",
    icon: "ti-edit",
    group: "Tickets",
  },
  {
    key: "canDeleteTicket",
    label: "Deletar tickets",
    desc: "Remover chamados permanentemente",
    icon: "ti-trash",
    group: "Tickets",
  },
  {
    key: "canChangeStatus",
    label: "Alterar status",
    desc: "Mover tickets entre Aberto/Andamento/Resolvido",
    icon: "ti-refresh",
    group: "Tickets",
  },
  {
    key: "canChangePriority",
    label: "Alterar prioridade",
    desc: "Definir nível de urgência dos chamados",
    icon: "ti-flag",
    group: "Tickets",
  },
  {
    key: "canCommentAny",
    label: "Comentar em qualquer ticket",
    desc: "Adicionar respostas em todos os chamados",
    icon: "ti-message",
    group: "Comunicação",
  },
  {
    key: "canViewReports",
    label: "Ver relatórios",
    desc: "Acesso ao dashboard de análise e métricas",
    icon: "ti-chart-bar",
    group: "Relatórios",
  },
  {
    key: "canViewUsers",
    label: "Ver usuários",
    desc: "Visualizar lista de membros do sistema",
    icon: "ti-users",
    group: "Usuários",
  },
  {
    key: "canManageUsers",
    label: "Gerenciar usuários",
    desc: "Criar, editar e remover membros",
    icon: "ti-user-cog",
    group: "Usuários",
  },
];

function Sk({ w = "100%", h = 14, dark, r = 6 }) {
  return (
    <div
      className={dark ? "skeleton" : "skeleton-light"}
      style={{ height: h, width: w, borderRadius: r }}
    />
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      type="button"
      style={{
        width: 40,
        height: 22,
        borderRadius: 99,
        background: checked ? "#16a34a" : "#e5e7eb",
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

export default function Settings() {
  const t = useThemeColors();
  const { dark } = useTheme();
  const { me } = useMe();
  const [tab, setTab] = useState("permissions");
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "AGENT",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("helpdesk_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [permsRes, usersRes, statsRes] = await Promise.allSettled([
        axios.get(`${API}/settings/permissions`, { headers }),
        axios.get(`${API}/users`, { headers }),
        axios.get(`${API}/settings/stats`, { headers }),
      ]);

      if (permsRes.status === "fulfilled") setPermissions(permsRes.value.data);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (role, key, value) => {
    setSaving(`${role}-${key}`);
    try {
      const res = await axios.patch(
        `${API}/settings/permissions/${role}`,
        { [key]: value },
        { headers },
      );
      setPermissions((prev) =>
        prev.map((p) => (p.role === role ? res.data : p)),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await axios.patch(`${API}/users/${id}`, { role }, { headers });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (err) {
      alert(err.response?.data?.message || "Erro");
    }
  };

  const handleToggleActive = async (id, active) => {
    try {
      await axios.patch(`${API}/users/${id}`, { active }, { headers });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active } : u)));
    } catch (err) {
      alert("Erro ao atualizar usuário");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deletar este usuário permanentemente?")) return;
    try {
      await axios.delete(`${API}/users/${id}`, { headers });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Sem permissão");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/users`, form, { headers });
      setUsers((prev) => [...prev, res.data]);
      setSuccess(`Usuário ${form.name} criado com sucesso!`);
      setForm({ name: "", email: "", password: "", role: "AGENT" });
      setTimeout(() => {
        setSuccess("");
        setShowCreateUser(false);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao criar usuário");
    } finally {
      setSubmitting(false);
    }
  };

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

  const groupedPerms = PERM_META.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {});

  const filteredUsers = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const TABS = [
    {
      key: "permissions",
      label: "Permissões por role",
      icon: "ti-shield-check",
    },
    { key: "users", label: "Gerenciar usuários", icon: "ti-users" },
    { key: "system", label: "Visão do sistema", icon: "ti-chart-bar" },
  ];

  const roleColors = ["#16a34a", "#2563eb", "#d97706", "#dc2626"];

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
          title="Configurações"
          subtitle="gerenciamento de permissões e sistema"
        />

        <div
          className="anim-fade"
          style={{ padding: 22, overflowY: "auto", flex: 1 }}
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
                Configurações do sistema
              </div>
              <div style={{ fontSize: 13, color: t.textMuted, marginTop: 3 }}>
                Gerencie permissões, usuários e configurações gerais
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  fontSize: 12,
                  padding: "6px 14px",
                  borderRadius: 99,
                  background: "rgba(22,163,74,0.1)",
                  color: "#16a34a",
                  fontWeight: 600,
                  border: "1px solid rgba(22,163,74,0.2)",
                }}
              >
                <i
                  className="ti ti-shield"
                  style={{ fontSize: 13, marginRight: 5 }}
                  aria-hidden="true"
                />
                SUPERADMIN
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 18,
              background: dark ? "#1a1a1a" : "#f1f5f9",
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: 4,
            }}
          >
            {TABS.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "10px",
                  borderRadius: 9,
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: tab === tb.key ? 600 : 400,
                  background: tab === tb.key ? t.cardBg : "transparent",
                  border: "none",
                  color: tab === tb.key ? t.textPrimary : t.textMuted,
                  boxShadow:
                    tab === tb.key
                      ? dark
                        ? "none"
                        : "0 1px 3px rgba(0,0,0,0.08)"
                      : "none",
                  transition: "all 0.15s",
                }}
              >
                <i
                  className={`ti ${tb.icon}`}
                  style={{
                    fontSize: 16,
                    color: tab === tb.key ? "#16a34a" : t.textMuted,
                  }}
                  aria-hidden="true"
                />
                {tb.label}
              </button>
            ))}
          </div>

          {/* TAB: Permissões */}
          {tab === "permissions" && (
            <div className="anim-fade">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 14,
                }}
              >
                {["ADMIN", "AGENT", "CLIENT"].map((role) => {
                  const rm = ROLE_META[role];
                  const perm = permissions.find((p) => p.role === role);
                  return (
                    <div key={role} style={{ ...card, overflow: "hidden" }}>
                      {/* Header do card */}
                      <div
                        style={{
                          padding: "16px 18px",
                          borderBottom: `1px solid ${t.border}`,
                          background: dark ? `${rm.color}10` : `${rm.color}08`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: rm.bg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <i
                              className={`ti ${rm.icon}`}
                              style={{ fontSize: 19, color: rm.color }}
                              aria-hidden="true"
                            />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: t.textPrimary,
                              }}
                            >
                              {rm.label}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: t.textMuted,
                                marginTop: 1,
                              }}
                            >
                              {users.filter((u) => u.role === role).length}{" "}
                              usuário
                              {users.filter((u) => u.role === role).length !== 1
                                ? "s"
                                : ""}{" "}
                              com este role
                            </div>
                          </div>
                          <div
                            style={{
                              marginLeft: "auto",
                              fontSize: 11,
                              padding: "3px 10px",
                              borderRadius: 99,
                              background: rm.bg,
                              color: rm.color,
                              fontWeight: 600,
                            }}
                          >
                            {perm
                              ? Object.values({
                                  canViewAllTickets: perm.canViewAllTickets,
                                  canCreateTicket: perm.canCreateTicket,
                                  canEditTicket: perm.canEditTicket,
                                  canDeleteTicket: perm.canDeleteTicket,
                                  canChangeStatus: perm.canChangeStatus,
                                  canChangePriority: perm.canChangePriority,
                                  canCommentAny: perm.canCommentAny,
                                  canViewReports: perm.canViewReports,
                                  canViewUsers: perm.canViewUsers,
                                  canManageUsers: perm.canManageUsers,
                                }).filter(Boolean).length
                              : 0}
                            /{PERM_META.length} ativos
                          </div>
                        </div>
                      </div>

                      {/* Permissões agrupadas */}
                      <div style={{ padding: "14px 18px" }}>
                        {loading ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                            }}
                          >
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Sk key={i} h={36} dark={dark} r={8} />
                            ))}
                          </div>
                        ) : !perm ? (
                          <div
                            style={{
                              textAlign: "center",
                              color: t.textMuted,
                              fontSize: 13,
                              padding: "20px 0",
                            }}
                          >
                            Carregando...
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0,
                            }}
                          >
                            {Object.entries(groupedPerms).map(
                              ([group, items]) => (
                                <div key={group}>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: t.textMuted,
                                      fontWeight: 600,
                                      letterSpacing: "0.06em",
                                      textTransform: "uppercase",
                                      padding: "10px 0 6px",
                                      borderBottom: `1px solid ${t.borderLight}`,
                                      marginBottom: 6,
                                    }}
                                  >
                                    {group}
                                  </div>
                                  {items.map((pm) => {
                                    const isActive = perm[pm.key];
                                    const isSaving =
                                      saving === `${role}-${pm.key}`;
                                    return (
                                      <div
                                        key={pm.key}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                          padding: "8px 0",
                                          borderBottom: `1px solid ${t.borderLight}`,
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 7,
                                            background: isActive
                                              ? `${rm.color}12`
                                              : dark
                                                ? "#1a1a1a"
                                                : "#f3f4f6",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            transition: "all 0.15s",
                                          }}
                                        >
                                          <i
                                            className={`ti ${pm.icon}`}
                                            style={{
                                              fontSize: 14,
                                              color: isActive
                                                ? rm.color
                                                : t.textMuted,
                                            }}
                                            aria-hidden="true"
                                          />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              fontWeight: 600,
                                              color: t.textPrimary,
                                            }}
                                          >
                                            {pm.label}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 10,
                                              color: t.textMuted,
                                              marginTop: 1,
                                            }}
                                          >
                                            {pm.desc}
                                          </div>
                                        </div>
                                        {isSaving ? (
                                          <i
                                            className="ti ti-loader-2 anim-spin"
                                            style={{
                                              fontSize: 16,
                                              color: rm.color,
                                            }}
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <Toggle
                                            checked={isActive}
                                            onChange={(v) =>
                                              handleToggle(role, pm.key, v)
                                            }
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: "14px 18px",
                  ...card,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <i
                  className="ti ti-info-circle"
                  style={{ fontSize: 16, color: "#2563eb" }}
                  aria-hidden="true"
                />
                <div style={{ fontSize: 12, color: t.textSecondary }}>
                  As permissões do <strong>SUPERADMIN</strong> não podem ser
                  alteradas — ele sempre tem acesso total ao sistema. Alterações
                  nas permissões têm efeito imediato para todos os usuários com
                  o role correspondente.
                </div>
              </div>
            </div>
          )}

          {/* TAB: Usuários */}
          {tab === "users" && (
            <div className="anim-fade">
              {/* Stats rápidos */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {[
                  {
                    label: "Total usuários",
                    value: users.length,
                    color: "#16a34a",
                    icon: "ti-users",
                  },
                  {
                    label: "Ativos",
                    value: users.filter((u) => u.active !== false).length,
                    color: "#2563eb",
                    icon: "ti-user-check",
                  },
                  {
                    label: "Inativos",
                    value: users.filter((u) => u.active === false).length,
                    color: "#dc2626",
                    icon: "ti-user-off",
                  },
                  {
                    label: "Admins/Agentes",
                    value: users.filter((u) =>
                      ["ADMIN", "AGENT"].includes(u.role),
                    ).length,
                    color: "#d97706",
                    icon: "ti-shield",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      ...card,
                      padding: "14px 16px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: s.color,
                        borderRadius: "14px 14px 0 0",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${s.color}12`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i
                          className={`ti ${s.icon}`}
                          style={{ fontSize: 16, color: s.color }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 700,
                        color: t.textPrimary,
                        lineHeight: 1,
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Barra ações */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
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
                    width: 280,
                  }}
                >
                  <i
                    className="ti ti-search"
                    style={{ fontSize: 14, color: t.textMuted }}
                    aria-hidden="true"
                  />
                  <input
                    placeholder="Buscar usuário..."
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
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowCreateUser(true)}
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
                  }}
                >
                  <i
                    className="ti ti-user-plus"
                    style={{ fontSize: 15 }}
                    aria-hidden="true"
                  />
                  Novo usuário
                </button>
              </div>

              {/* Tabela */}
              <div style={{ ...card, overflow: "hidden" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr 200px 130px 110px 130px",
                    gap: 12,
                    padding: "10px 16px",
                    background: dark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                    fontSize: 11,
                    color: t.textMuted,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <span></span>
                  <span>Usuário</span>
                  <span>Email</span>
                  <span>Função</span>
                  <span>Status</span>
                  <span>Ações</span>
                </div>
                {loading ? (
                  <div
                    style={{
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {[1, 2, 3, 4].map((i) => (
                      <Sk key={i} h={52} dark={dark} r={8} />
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
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
                    <div style={{ fontSize: 14 }}>
                      Nenhum usuário encontrado
                    </div>
                  </div>
                ) : (
                  filteredUsers.map((u, i) => {
                    const rm = ROLE_META[u.role] || ROLE_META.CLIENT;
                    const isSA = u.role === "SUPERADMIN";
                    const initials = u.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const isActive = u.active !== false;
                    return (
                      <div
                        key={u.id}
                        className={`anim-fade anim-d${Math.min(i + 1, 5)}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "44px 1fr 200px 130px 110px 130px",
                          gap: 12,
                          padding: "13px 16px",
                          borderBottom: `1px solid ${t.borderLight}`,
                          alignItems: "center",
                          transition: "background 0.12s",
                          opacity: isActive ? 1 : 0.6,
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
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: isSA
                              ? "linear-gradient(135deg,#16a34a,#22c55e)"
                              : rm.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: isSA ? "#fff" : rm.color,
                            boxShadow: isSA
                              ? "0 2px 6px rgba(22,163,74,0.3)"
                              : "none",
                          }}
                        >
                          {initials}
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: t.textPrimary,
                            }}
                          >
                            {u.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: t.textMuted,
                              marginTop: 1,
                            }}
                          >
                            {isSA
                              ? "👑 Acesso total ao sistema"
                              : `Membro desde ${new Date(u.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: 12,
                            color: t.textSecondary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {u.email}
                        </span>

                        <span>
                          {isSA ? (
                            <span
                              style={{
                                fontSize: 11,
                                padding: "4px 10px",
                                borderRadius: 99,
                                background: "rgba(22,163,74,0.12)",
                                color: "#16a34a",
                                fontWeight: 600,
                              }}
                            >
                              Superadmin
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value)
                              }
                              style={{
                                background: rm.bg,
                                border: `1px solid ${rm.color}30`,
                                borderRadius: 8,
                                padding: "5px 10px",
                                fontSize: 12,
                                color: rm.color,
                                fontFamily: "inherit",
                                cursor: "pointer",
                                outline: "none",
                                fontWeight: 600,
                              }}
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="AGENT">Agente</option>
                              <option value="CLIENT">Cliente</option>
                            </select>
                          )}
                        </span>

                        <span>
                          {isSA ? (
                            <span
                              style={{
                                fontSize: 11,
                                padding: "4px 10px",
                                borderRadius: 99,
                                background: "rgba(22,163,74,0.1)",
                                color: "#16a34a",
                                fontWeight: 500,
                              }}
                            >
                              <i
                                className="ti ti-check"
                                style={{ fontSize: 11, marginRight: 4 }}
                              />
                              ativo
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                handleToggleActive(u.id, !isActive)
                              }
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 11,
                                padding: "4px 10px",
                                borderRadius: 99,
                                background: isActive
                                  ? "rgba(22,163,74,0.1)"
                                  : "rgba(239,68,68,0.1)",
                                color: isActive ? "#16a34a" : "#dc2626",
                                border: `1px solid ${isActive ? "rgba(22,163,74,0.2)" : "rgba(239,68,68,0.2)"}`,
                                cursor: "pointer",
                                fontWeight: 500,
                                transition: "all 0.15s",
                              }}
                            >
                              <i
                                className={`ti ${isActive ? "ti-check" : "ti-x"}`}
                                style={{ fontSize: 11 }}
                                aria-hidden="true"
                              />
                              {isActive ? "ativo" : "inativo"}
                            </button>
                          )}
                        </span>

                        <div style={{ display: "flex", gap: 6 }}>
                          {!isSA && (
                            <button
                              onClick={() => handleDelete(u.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "6px 10px",
                                background: "rgba(239,68,68,0.06)",
                                border: "1px solid rgba(239,68,68,0.2)",
                                borderRadius: 8,
                                color: "#dc2626",
                                fontSize: 12,
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(239,68,68,0.12)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(239,68,68,0.06)")
                              }
                            >
                              <i
                                className="ti ti-trash"
                                style={{ fontSize: 13 }}
                                aria-hidden="true"
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: Sistema */}
          {tab === "system" && (
            <div className="anim-fade">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,1fr)",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                {/* Estatísticas gerais */}
                <div style={{ ...card, padding: "18px 20px" }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: t.textPrimary,
                      marginBottom: 16,
                    }}
                  >
                    Resumo do sistema
                  </div>
                  {loading ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <Sk key={i} h={44} dark={dark} r={8} />
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                      }}
                    >
                      {[
                        {
                          label: "Total usuários",
                          value: stats?.totalUsers || 0,
                          color: "#16a34a",
                          icon: "ti-users",
                        },
                        {
                          label: "Total tickets",
                          value: stats?.totalTickets || 0,
                          color: "#2563eb",
                          icon: "ti-ticket",
                        },
                        {
                          label: "Tickets abertos",
                          value: stats?.openTickets || 0,
                          color: "#dc2626",
                          icon: "ti-clock",
                        },
                        {
                          label: "Resolvidos",
                          value: stats?.resolvedTickets || 0,
                          color: "#16a34a",
                          icon: "ti-circle-check",
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          style={{
                            background: dark
                              ? "rgba(255,255,255,0.03)"
                              : "#f8fafc",
                            border: `1px solid ${t.border}`,
                            borderRadius: 10,
                            padding: "14px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 9,
                              background: `${s.color}12`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto 8px",
                            }}
                          >
                            <i
                              className={`ti ${s.icon}`}
                              style={{ fontSize: 18, color: s.color }}
                              aria-hidden="true"
                            />
                          </div>
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 700,
                              color: t.textPrimary,
                            }}
                          >
                            {s.value}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: t.textMuted,
                              marginTop: 3,
                            }}
                          >
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Distribuição por role */}
                <div style={{ ...card, padding: "18px 20px" }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: t.textPrimary,
                      marginBottom: 16,
                    }}
                  >
                    Usuários por função
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
                        gap: 14,
                      }}
                    >
                      {["SUPERADMIN", "ADMIN", "AGENT", "CLIENT"].map(
                        (role, i) => {
                          const count = users.filter(
                            (u) => u.role === role,
                          ).length;
                          const pct =
                            users.length > 0
                              ? Math.round((count / users.length) * 100)
                              : 0;
                          const color = roleColors[i];
                          const label =
                            role === "SUPERADMIN"
                              ? "Superadmin"
                              : ROLE_META[role]?.label || role;
                          return (
                            <div key={role}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: 6,
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
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      background: color,
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: 13,
                                      color: t.textSecondary,
                                      fontWeight: 500,
                                    }}
                                  >
                                    {label}
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
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: t.textPrimary,
                                    }}
                                  >
                                    {count}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      padding: "2px 8px",
                                      borderRadius: 99,
                                      background: `${color}12`,
                                      color,
                                      fontWeight: 500,
                                    }}
                                  >
                                    {pct}%
                                  </span>
                                </div>
                              </div>
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
                                    background: color,
                                    width: `${pct}%`,
                                    transition: "width 1s ease",
                                    boxShadow: `0 0 8px ${color}40`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Info do sistema */}
              <div style={{ ...card, padding: "18px 20px" }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: t.textPrimary,
                    marginBottom: 16,
                  }}
                >
                  Informações do sistema
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 10,
                  }}
                >
                  {[
                    {
                      label: "Stack frontend",
                      value: "React 19 + Vite 8",
                      icon: "ti-brand-react",
                      color: "#2563eb",
                    },
                    {
                      label: "Stack backend",
                      value: "Node.js + Express 5",
                      icon: "ti-server",
                      color: "#16a34a",
                    },
                    {
                      label: "Banco de dados",
                      value: "PostgreSQL + Supabase",
                      icon: "ti-database",
                      color: "#d97706",
                    },
                    {
                      label: "Cache",
                      value: "Redis + Upstash",
                      icon: "ti-bolt",
                      color: "#dc2626",
                    },
                    {
                      label: "Deploy frontend",
                      value: "Vercel",
                      icon: "ti-brand-vercel",
                      color: "#6b7280",
                    },
                    {
                      label: "Deploy backend",
                      value: "Render",
                      icon: "ti-cloud",
                      color: "#7c3aed",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                        border: `1px solid ${t.border}`,
                        borderRadius: 10,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: `${s.color}12`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <i
                          className={`ti ${s.icon}`}
                          style={{ fontSize: 18, color: s.color }}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: t.textMuted,
                            fontWeight: 500,
                            marginBottom: 3,
                          }}
                        >
                          {s.label}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: t.textPrimary,
                          }}
                        >
                          {s.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal criar usuário */}
      {showCreateUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="anim-scale"
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              width: "100%",
              maxWidth: 500,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
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
                }}
              >
                <i
                  className="ti ti-user-plus"
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
                  Criar novo usuário
                </div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>
                  Adicione um novo membro ao sistema
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateUser(false);
                  setError("");
                  setSuccess("");
                }}
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

            <form
              onSubmit={handleCreateUser}
              style={{
                padding: "20px 24px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label style={lbl}>Nome completo</label>
                  <input
                    style={inp}
                    placeholder="Ex: João Silva"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input
                    type="email"
                    style={inp}
                    placeholder="joao@empresa.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label style={lbl}>Senha provisória</label>
                <input
                  type="password"
                  style={inp}
                  placeholder="mínimo 6 caracteres"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label style={lbl}>Função</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 8,
                  }}
                >
                  {[
                    {
                      value: "AGENT",
                      label: "Agente",
                      icon: "ti-headset",
                      color: "#d97706",
                    },
                    {
                      value: "ADMIN",
                      label: "Admin",
                      icon: "ti-user-check",
                      color: "#2563eb",
                    },
                    {
                      value: "CLIENT",
                      label: "Cliente",
                      icon: "ti-user",
                      color: "#6b7280",
                    },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.value })}
                      style={{
                        padding: "12px 8px",
                        borderRadius: 10,
                        border: `1.5px solid ${form.role === r.value ? r.color : t.border}`,
                        background:
                          form.role === r.value ? `${r.color}12` : t.inputBg,
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background:
                            form.role === r.value
                              ? `${r.color}18`
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
                          className={`ti ${r.icon}`}
                          style={{
                            fontSize: 15,
                            color:
                              form.role === r.value ? r.color : t.textMuted,
                          }}
                          aria-hidden="true"
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            form.role === r.value ? r.color : t.textPrimary,
                        }}
                      >
                        {r.label}
                      </div>
                    </button>
                  ))}
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
                  />
                  <span style={{ fontSize: 12, color: "#dc2626" }}>
                    {error}
                  </span>
                </div>
              )}
              {success && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    background: "rgba(22,163,74,0.08)",
                    border: "1px solid rgba(22,163,74,0.2)",
                    borderRadius: 9,
                  }}
                >
                  <i
                    className="ti ti-circle-check"
                    style={{ color: "#16a34a", fontSize: 15 }}
                  />
                  <span style={{ fontSize: 12, color: "#16a34a" }}>
                    {success}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUser(false);
                    setError("");
                    setSuccess("");
                  }}
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
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "11px",
                    background: "linear-gradient(135deg,#16a34a,#22c55e)",
                    border: "none",
                    borderRadius: 10,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                  }}
                >
                  <i
                    className={`ti ${submitting ? "ti-loader-2 anim-spin" : "ti-user-plus"}`}
                    style={{ fontSize: 14 }}
                    aria-hidden="true"
                  />
                  {submitting ? "Criando..." : "Criar usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
