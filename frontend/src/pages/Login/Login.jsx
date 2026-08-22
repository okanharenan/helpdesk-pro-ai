import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const INACTIVITY_LIMIT = 72 * 60 * 60 * 1000; // 72 horas em ms

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Verifica se sessão expirou por inatividade ao entrar na tela de login
  useEffect(() => {
    const lastActivity = localStorage.getItem("last_activity");
    const token = localStorage.getItem("helpdesk_token");
    if (token && lastActivity) {
      const diff = Date.now() - parseInt(lastActivity);
      if (diff > INACTIVITY_LIMIT) {
        localStorage.removeItem("helpdesk_token");
        localStorage.removeItem("last_activity");
        setError("Sua sessão expirou por inatividade. Faça login novamente.");
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, form);
      login(data.user, data.token);
      localStorage.setItem("last_activity", Date.now().toString());
      navigate("/");
    } catch {
      setError("Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div className="anim-scale" style={s.card}>
        <h1 style={s.title}>[ HELPDESK ]</h1>
        <p style={s.sub}>Entre na sua conta</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              type="email"
              style={s.input}
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Senha</label>
            <input
              type="password"
              style={s.input}
              placeholder="••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <div style={{ textAlign: "right" }}>
            <Link to="/forgot-password" style={s.link}>
              Esqueceu a senha?
            </Link>
          </div>

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? "Entrando..." : "ENTRAR →"}
          </button>
        </form>

        <p style={s.footer}>
          Não tem conta?{" "}
          <Link to="/register" style={s.link}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0d0d0d",
    fontFamily: "monospace",
  },
  card: {
    background: "#141414",
    border: "1px solid #242424",
    borderRadius: 10,
    padding: "32px 28px",
    width: "100%",
    maxWidth: 380,
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    color: "#b8ff57",
    marginBottom: 4,
    textAlign: "center",
  },
  sub: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: "0.08em",
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: {
    fontSize: 10,
    color: "#888",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  },
  input: {
    background: "#1c1c1c",
    border: "1px solid #242424",
    borderRadius: 6,
    padding: "9px 12px",
    fontSize: 13,
    color: "#f4f4f4",
    fontFamily: "monospace",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  error: { fontSize: 12, color: "#ff4d4d", textAlign: "center" },
  link: { fontSize: 11, color: "#b8ff57", textDecoration: "none" },
  btn: {
    padding: 10,
    background: "#b8ff57",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 800,
    color: "#0d0d0d",
    cursor: "pointer",
    letterSpacing: "0.05em",
    width: "100%",
  },
  footer: { textAlign: "center", fontSize: 12, color: "#666", marginTop: 20 },
};
