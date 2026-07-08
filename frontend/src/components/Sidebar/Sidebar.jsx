import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useMe } from "../../contexts/MeContext";

const links = [
  {
    path: "/",
    label: "Dashboard",
    icon: "ti-layout-dashboard",
    color: "#16a34a",
  },
  { path: "/tickets", label: "Tickets", icon: "ti-ticket", color: "#2563eb" },
  { path: "/users", label: "Usuários", icon: "ti-users", color: "#d97706" },
  {
    path: "/reports",
    label: "Relatórios",
    icon: "ti-chart-bar",
    color: "#7c3aed",
  },
  {
    path: "/settings",
    label: "Configurações",
    icon: "ti-settings",
    color: "#0891b2",
  },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { me, clearMe } = useMe();
  const [hoveredPath, setHoveredPath] = useState(null);

  const dbRole = me?.role;

  const bg = dark ? "#0f0f0f" : "#ffffff";
  const border = dark ? "#1f1f1f" : "#e5e7eb";
  const text = dark ? "#f4f4f4" : "#111111";
  const sec = dark ? "#a0a0a0" : "#374151";
  const muted = dark ? "#555555" : "#9ca3af";
  const inputBg = dark ? "#1a1a1a" : "#f9fafb";
  const hoverBg = dark ? "#161616" : "#f8fafc";

  const handleLogout = () => {
    clearMe();
    logout();
    navigate("/login");
  };

  const initials = (me?.name || user?.user_metadata?.name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleColors = {
    SUPERADMIN: "#16a34a",
    ADMIN: "#2563eb",
    AGENT: "#d97706",
    CLIENT: "#6b7280",
  };
  const roleColor = roleColors[dbRole] || "#6b7280";

  // Filtra Configurações para mostrar só para SUPERADMIN
  const visibleLinks = links.filter((l) => {
    if (l.path === "/settings") return dbRole === "SUPERADMIN";
    if (l.path === "/users") return ["SUPERADMIN", "ADMIN"].includes(dbRole);
    return true;
  });

  return (
    <div
      style={{
        width: 220,
        minHeight: "100vh",
        background: bg,
        borderRight: `1px solid ${border}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', system-ui, sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "18px 16px 14px",
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
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
              boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
              flexShrink: 0,
            }}
          >
            <i
              className="ti ti-headset"
              style={{ fontSize: 16, color: "#fff" }}
              aria-hidden="true"
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: text,
                letterSpacing: "-0.3px",
                lineHeight: 1.2,
              }}
            >
              HelpDesk Pro
            </div>
            <div style={{ fontSize: 10, color: muted, marginTop: 1 }}>
              Serviços Gerais
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "12px 10px", flex: 1 }}>
        <div
          style={{
            fontSize: 10,
            color: muted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "0 8px",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          workspace
        </div>

        {visibleLinks.map(({ path, label, icon, color }) => {
          const active = pathname === path;
          const hovered = hoveredPath === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              onMouseEnter={() => setHoveredPath(path)}
              onMouseLeave={() => setHoveredPath(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                width: "100%",
                padding: "9px 10px",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
                marginBottom: 2,
                textAlign: "left",
                fontWeight: active ? 600 : 400,
                color: active ? color : hovered ? text : sec,
                background: active
                  ? `${color}12`
                  : hovered
                    ? hoverBg
                    : "transparent",
                border: `1px solid ${active ? `${color}30` : "transparent"}`,
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              {active && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 18,
                    background: color,
                    borderRadius: "0 3px 3px 0",
                  }}
                />
              )}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: active
                    ? `${color}18`
                    : hovered
                      ? `${color}10`
                      : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                <i
                  className={`ti ${icon}`}
                  style={{
                    fontSize: 15,
                    color: active ? color : hovered ? color : sec,
                    transition: "color 0.15s",
                  }}
                  aria-hidden="true"
                />
              </div>
              {label}
            </button>
          );
        })}

        <div style={{ height: 1, background: border, margin: "10px 8px" }} />

        <button
          onClick={toggle}
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            width: "100%",
            padding: "9px 10px",
            background: "transparent",
            border: "1px solid transparent",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
            color: sec,
            transition: "all 0.15s",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: dark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <i
              className={`ti ${dark ? "ti-sun" : "ti-moon"}`}
              style={{ fontSize: 15, color: sec }}
              aria-hidden="true"
            />
          </div>
          {dark ? "Modo claro" : "Modo escuro"}
        </button>
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${border}` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "10px 10px",
            background: dark ? "#161616" : "#f8fafc",
            border: `1px solid ${border}`,
            borderRadius: 9,
            marginBottom: 8,
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: `linear-gradient(135deg,${roleColor},${roleColor}cc)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                boxShadow: `0 2px 6px ${roleColor}40`,
              }}
            >
              {initials}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#16a34a",
                border: `2px solid ${dark ? "#161616" : "#f8fafc"}`,
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {me?.name || user?.user_metadata?.name || "Usuário"}
            </div>
            <span
              style={{
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 99,
                background: `${roleColor}15`,
                color: roleColor,
                fontWeight: 600,
              }}
            >
              {dbRole || "..."}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.06)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
            e.currentTarget.style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = border;
            e.currentTarget.style.color = sec;
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "8px 10px",
            background: "transparent",
            border: `1px solid ${border}`,
            borderRadius: 8,
            fontSize: 12,
            cursor: "pointer",
            color: sec,
            transition: "all 0.15s",
          }}
        >
          <i
            className="ti ti-logout"
            style={{ fontSize: 14 }}
            aria-hidden="true"
          />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
