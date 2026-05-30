import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icone from "../components/Icone";
import { Alerta } from "../components/ui";
import { useAuth } from "../auth";
import { api } from "../api";

export default function Cadastro() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [tipos, setTipos] = useState([]);
  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    username: "",
    password: "",
    tipo: "aluno",
  });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // As opções de tipo público vêm da API; se falhar, usa um fallback fixo.
    api
      .get("/opcoes")
      .then((o) => setTipos(o.tipos_publicos))
      .catch(() =>
        setTipos([
          { valor: "aluno", label: "Aluno" },
          { valor: "professor", label: "Professor" },
          { valor: "funcionario", label: "Funcionário" },
        ])
      );
  }, []);

  function mudar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await registrar(form);
      navigate("/dashboard");
    } catch (err) {
      setErro(err.message || "Não foi possível criar a conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-lado">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="selo"><Icone nome="usuario" /> Criar conta</div>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "1rem" }}>
            Bem-vindo(a) ao <span style={{ color: "#ffd1d9" }}>HelpDesk</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,.82)", maxWidth: 380 }}>
            Crie sua conta para abrir e acompanhar chamados de suporte técnico da instituição.
          </p>
        </div>
      </div>

      <div className="auth-form">
        <div className="auth-card surge">
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: ".3rem" }}>Cadastro</h2>
          <p className="texto-suave mb-3">Preencha os dados abaixo.</p>

          <Alerta tipo="erro">{erro}</Alerta>

          <form onSubmit={enviar}>
            <div className="form-grupo">
              <label className="form-label">Nome completo <span className="req">*</span></label>
              <input className="form-control" name="nome_completo" value={form.nome_completo} onChange={mudar} required />
            </div>
            <div className="form-grupo">
              <label className="form-label">E-mail <span className="req">*</span></label>
              <input className="form-control" type="email" name="email" value={form.email} onChange={mudar} required />
            </div>
            <div className="row">
              <div className="col form-grupo">
                <label className="form-label">Usuário <span className="req">*</span></label>
                <input className="form-control" name="username" value={form.username} onChange={mudar} required />
              </div>
              <div className="col form-grupo">
                <label className="form-label">Perfil <span className="req">*</span></label>
                <select className="form-select" name="tipo" value={form.tipo} onChange={mudar}>
                  {tipos.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-grupo">
              <label className="form-label">Senha <span className="req">*</span></label>
              <input className="form-control" type="password" name="password" value={form.password} onChange={mudar} minLength={6} required />
              <div className="texto-suave small mt-1">Mínimo de 6 caracteres.</div>
            </div>
            <button className="btn btn-primary btn-lg w-100" disabled={enviando}>
              <Icone nome="check" /> {enviando ? "Criando..." : "Criar conta"}
            </button>
          </form>

          <p className="text-center mt-3 texto-suave">
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
