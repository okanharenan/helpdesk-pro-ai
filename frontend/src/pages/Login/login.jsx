import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, form);
      login(data.user, data.token);
      navigate("/");
    } catch {
      setError("Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  const inp = { ...s.input };

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
              style={inp}
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
              style={inp}
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
        <div style={s.divider}>
          <span style={s.divLine} />
          <span style={s.divText}>ou entre com</span>
          <span style={s.divLine} />
        </div>
        <div style={s.social}>
          <a href={`${API}/auth/google`} style={s.socialBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </a>
          <a href={`${API}/auth/facebook`} style={s.socialBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </a>
        </div>
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
  },
  divider: { display: "flex", alignItems: "center", gap: 10, margin: "20px 0" },
  divLine: { flex: 1, height: 1, background: "#242424" },
  divText: {
    fontSize: 10,
    color: "#444",
    letterSpacing: "0.1em",
    whiteSpace: "nowrap",
  },
  social: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 20,
  },
  socialBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 9,
    background: "#1c1c1c",
    border: "1px solid #242424",
    borderRadius: 6,
    fontSize: 12,
    color: "#c0c0c0",
    textDecoration: "none",
  },
  footer: { textAlign: "center", fontSize: 12, color: "#666" },
};
