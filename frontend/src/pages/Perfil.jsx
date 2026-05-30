import { useState } from "react";
import Icone from "../components/Icone";
import { Alerta, Avatar } from "../components/ui";
import { useAuth } from "../auth";
import { api } from "../api";

export default function Perfil() {
  const { usuario, atualizarUsuario } = useAuth();
  const [form, setForm] = useState({
    nome_completo: usuario.nome || "",
    email: usuario.email || "",
    telefone: usuario.telefone || "",
    setor: usuario.setor || "",
  });
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function mudar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar(e) {
    e.preventDefault();
    setMsg("");
    setErro("");
    setSalvando(true);
    try {
      const u = await api.patch("/usuarios/me", form);
      atualizarUsuario(u);
      setMsg("Perfil atualizado com sucesso.");
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Conta</div>
          <h1>Meu perfil</h1>
        </div>
      </div>

      <div className="row">
        <div className="col" style={{ maxWidth: 620 }}>
          <div className="bloco">
            <Alerta tipo="sucesso">{msg}</Alerta>
            <Alerta tipo="erro">{erro}</Alerta>

            <div className="flex items-center mb-3" style={{ gap: ".9rem" }}>
              <Avatar nome={usuario.nome} equipe={usuario.is_equipe} />
              <div>
                <div className="fw-bold">{usuario.nome}</div>
                <div className="texto-suave small">@{usuario.username} · {usuario.tipo_label}</div>
              </div>
            </div>

            <form onSubmit={salvar}>
              <div className="form-grupo">
                <label className="form-label">Nome completo</label>
                <input className="form-control" name="nome_completo" value={form.nome_completo} onChange={mudar} />
              </div>
              <div className="form-grupo">
                <label className="form-label">E-mail</label>
                <input className="form-control" type="email" name="email" value={form.email} onChange={mudar} />
              </div>
              <div className="row">
                <div className="col form-grupo">
                  <label className="form-label">Telefone</label>
                  <input className="form-control" name="telefone" value={form.telefone} onChange={mudar} placeholder="(81) 99999-0000" />
                </div>
                <div className="col form-grupo">
                  <label className="form-label">Setor / Curso</label>
                  <input className="form-control" name="setor" value={form.setor} onChange={mudar} />
                </div>
              </div>
              <button className="btn btn-primary" disabled={salvando}>
                <Icone nome="check" /> {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </form>
          </div>
        </div>

        <div className="col" style={{ maxWidth: 340 }}>
          <div className="bloco">
            <div className="bloco-titulo"><Icone nome="escudo" /> Tipo de conta</div>
            <p className="texto-suave small" style={{ lineHeight: 1.6 }}>
              Seu perfil é <strong>{usuario.tipo_label}</strong>.
              {usuario.is_admin && " Você tem acesso total ao sistema, incluindo o painel administrativo."}
              {usuario.is_tecnico && " Você pode assumir e gerenciar chamados, além de ver relatórios."}
              {usuario.is_comum && " Você pode abrir chamados e acompanhar o andamento dos seus pedidos."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
