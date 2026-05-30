import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icone from "../components/Icone";
import { Alerta, BadgePrioridade, BadgeStatus, Carregando, Vazio } from "../components/ui";
import { api, formatarData } from "../api";

function Stat({ icone, num, rotulo, variante = "" }) {
  return (
    <div className={"stat " + variante}>
      <div className="stat-ico"><Icone nome={icone} /></div>
      <div>
        <div className="stat-num">{num}</div>
        <div className="stat-rotulo">{rotulo}</div>
      </div>
    </div>
  );
}

export default function Painel() {
  const [dados, setDados] = useState(null);
  const [opcoes, setOpcoes] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      const d = await api.get("/painel");
      setDados(d);
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    carregar();
    api.get("/opcoes").then(setOpcoes).catch(() => {});
    api.get("/usuarios/tecnicos").then(setTecnicos).catch(() => {});
  }, []);

  async function atualizarChamado(chamadoId, campo, valor) {
    try {
      const body = { chamado_id: chamadoId };
      if (campo === "status") body.status = valor;
      if (campo === "tecnico") body.tecnico_id = valor === "" ? null : Number(valor);
      // mantém o outro campo como está, enviando o atual
      const atual = dados.chamados.find((c) => c.id === chamadoId);
      if (campo === "status") body.tecnico_id = atual.tecnico?.id ?? null;
      if (campo === "tecnico") body.status = atual.status;
      await api.post("/painel/atualizar", body);
      setMsg(`Chamado #${chamadoId} atualizado.`);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  if (erro && !dados) return <div className="bloco"><Vazio titulo="Erro" texto={erro} /></div>;
  if (!dados) return <Carregando />;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Administração</div>
          <h1>Painel administrativo</h1>
        </div>
        <Link to="/relatorios" className="btn btn-claro"><Icone nome="relatorio" /> Ver relatórios</Link>
      </div>

      <Alerta tipo="sucesso">{msg}</Alerta>

      <div className="grid grid-4 mb-3">
        <Stat icone="ticket" num={dados.total} rotulo="Total" />
        <Stat icone="relogio" num={dados.abertos} rotulo="Em aberto" variante="alerta" />
        <Stat icone="raio" num={dados.urgentes} rotulo="Urgentes" variante="vinho" />
        <Stat icone="alerta" num={dados.sem_tecnico} rotulo="Sem técnico" />
      </div>

      {/* gestão rápida de chamados */}
      <div className="bloco mb-3">
        <div className="bloco-titulo"><Icone nome="lista" /> Gestão de chamados (25 mais recentes)</div>
        <div className="tabela-wrap">
          <table className="tabela-nassau">
            <thead>
              <tr>
                <th>#</th><th>Título</th><th>Prioridade</th><th>Status</th><th>Técnico</th><th></th>
              </tr>
            </thead>
            <tbody>
              {dados.chamados.map((ch) => (
                <tr key={ch.id}>
                  <td className="fw-bold">#{ch.id}</td>
                  <td style={{ maxWidth: 240 }}>{ch.titulo}</td>
                  <td><BadgePrioridade chamado={ch} /></td>
                  <td>
                    <select
                      className="form-select"
                      style={{ minWidth: 140, padding: ".3rem .5rem", fontSize: ".82rem" }}
                      value={ch.status}
                      onChange={(e) => atualizarChamado(ch.id, "status", e.target.value)}
                    >
                      {opcoes?.status.map((s) => <option key={s.valor} value={s.valor}>{s.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      style={{ minWidth: 140, padding: ".3rem .5rem", fontSize: ".82rem" }}
                      value={ch.tecnico?.id ?? ""}
                      onChange={(e) => atualizarChamado(ch.id, "tecnico", e.target.value)}
                    >
                      <option value="">— Sem técnico —</option>
                      {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                  </td>
                  <td><Link to={`/chamados/${ch.id}`} className="btn btn-claro btn-sm">Abrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="bloco">
          <div className="bloco-titulo"><Icone nome="escudo" /> Carga dos técnicos</div>
          <div className="tabela-wrap">
            <table className="tabela-nassau">
              <thead><tr><th>Técnico</th><th>Perfil</th><th className="text-end">Em aberto</th></tr></thead>
              <tbody>
                {dados.tecnicos.map((t) => (
                  <tr key={t.id}>
                    <td>{t.nome}</td>
                    <td><span className="texto-suave small">{t.tipo_label}</span></td>
                    <td className="text-end fw-bold">{t.carga}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bloco">
          <div className="bloco-titulo"><Icone nome="usuario" /> Usuários recentes</div>
          <div className="tabela-wrap">
            <table className="tabela-nassau">
              <thead><tr><th>Nome</th><th>Perfil</th><th>Setor</th></tr></thead>
              <tbody>
                {dados.usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nome}</td>
                    <td><span className="texto-suave small">{u.tipo_label}</span></td>
                    <td><span className="texto-suave small">{u.setor || "—"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
