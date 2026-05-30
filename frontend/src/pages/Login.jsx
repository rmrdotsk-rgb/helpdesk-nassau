import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icone from "../components/Icone";
import { Alerta } from "../components/ui";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function mudar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await login(form.username, form.password);
      navigate("/dashboard");
    } catch (err) {
      setErro(err.message || "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-lado">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="selo"><Icone nome="escudo" /> Acesso ao sistema</div>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "1rem" }}>
            HelpDesk <span style={{ color: "#ffd1d9" }}>Nassau</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,.82)", maxWidth: 380 }}>
            Central de chamados técnicos da instituição. Abra solicitações, acompanhe o andamento e
            converse com a equipe de suporte em um só lugar.
          </p>
        </div>
      </div>

      <div className="auth-form">
        <div className="auth-card surge">
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: ".3rem" }}>Entrar</h2>
          <p className="texto-suave mb-3">Use seu usuário e senha para acessar.</p>

          <Alerta tipo="erro">{erro}</Alerta>

          <form onSubmit={enviar}>
            <div className="form-grupo">
              <label className="form-label">Usuário</label>
              <input
                className="form-control"
                name="username"
                value={form.username}
                onChange={mudar}
                autoFocus
                required
              />
            </div>
            <div className="form-grupo">
              <label className="form-label">Senha</label>
              <input
                className="form-control"
                type="password"
                name="password"
                value={form.password}
                onChange={mudar}
                required
              />
            </div>
            <button className="btn btn-primary btn-lg w-100" disabled={enviando}>
              <Icone nome="entrar" /> {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center mt-3 texto-suave">
            Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>

          <div className="card mt-3" style={{ background: "var(--surface-2)" }}>
            <div className="card-corpo small">
              <strong>Acesso de demonstração</strong>
              <div className="texto-suave mt-1">
                admin / admin123 · tecnico1 / tecnico123 · aluno1 / aluno123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
