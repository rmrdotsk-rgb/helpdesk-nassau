import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icone from "../components/Icone";
import {
  Alerta,
  Avatar,
  BadgePrioridade,
  BadgeStatus,
  Carregando,
  Vazio,
} from "../components/ui";
import { useAuth } from "../auth";
import { api, formatarData, tempoRelativo } from "../api";

export default function DetalheChamado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [chamado, setChamado] = useState(null);
  const [opcoes, setOpcoes] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");

  async function carregar() {
    try {
      const ch = await api.get(`/chamados/${id}`);
      setChamado(ch);
      setErro("");
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    carregar();
    api.get("/opcoes").then(setOpcoes).catch(() => {});
  }, [id]);

  useEffect(() => {
    // técnicos só são necessários para a equipe (select de responsável)
    if (usuario?.is_equipe) {
      api.get("/usuarios/tecnicos").then(setTecnicos).catch(() => {});
    }
  }, [usuario]);

  if (erro) {
    return (
      <div className="bloco">
        <Vazio titulo="Não foi possível abrir o chamado" texto={erro} />
        <div className="text-center">
          <button className="btn btn-claro" onClick={() => navigate("/chamados")}>Voltar à lista</button>
        </div>
      </div>
    );
  }
  if (!chamado) return <Carregando />;

  const ehEquipe = usuario?.is_equipe;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Chamado #{chamado.id}</div>
          <h1 style={{ maxWidth: 760 }}>{chamado.titulo}</h1>
          <div className="flex flex-wrap mt-1" style={{ gap: ".5rem" }}>
            <BadgeStatus chamado={chamado} />
            <BadgePrioridade chamado={chamado} />
            <span className="cat-tag"><Icone nome="tag" /> {chamado.categoria_label}</span>
            <span className="cat-tag"><Icone nome="local" /> {chamado.localizacao_label}</span>
            {chamado.esta_atrasado && <span className="atrasado-dot">atrasado (SLA)</span>}
          </div>
        </div>
        <button className="btn btn-claro nao-imprimir" onClick={() => navigate(-1)}><Icone nome="voltar" /> Voltar</button>
      </div>

      <Alerta tipo="sucesso">{msg}</Alerta>

      <div className="row">
        {/* coluna principal */}
        <div className="col" style={{ minWidth: 320 }}>
          <div className="bloco mb-3">
            <div className="bloco-titulo"><Icone nome="ticket" /> Descrição</div>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{chamado.descricao}</p>
          </div>

          {chamado.solucao_final && (
            <div className="bloco mb-3" style={{ borderLeft: "4px solid var(--ok)" }}>
              <div className="bloco-titulo" style={{ color: "var(--ok-700)" }}>
                <Icone nome="check" /> Solução aplicada
              </div>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{chamado.solucao_final}</p>
            </div>
          )}

          <Comentarios chamado={chamado} aoEnviar={carregar} setMsg={setMsg} />
        </div>

        {/* coluna lateral */}
        <div className="col" style={{ maxWidth: 360, minWidth: 280 }}>
          <div className="bloco mb-3">
            <div className="bloco-titulo"><Icone nome="pessoa" /> Informações</div>
            <Info rotulo="Solicitante" valor={chamado.solicitante?.nome} />
            <Info rotulo="Técnico responsável" valor={chamado.tecnico?.nome || "— Sem técnico —"} />
            <Info rotulo="Aberto em" valor={formatarData(chamado.data_abertura)} />
            <Info rotulo="Última atualização" valor={formatarData(chamado.data_atualizacao)} />
            {chamado.data_resolucao && <Info rotulo="Resolvido em" valor={formatarData(chamado.data_resolucao)} />}
            {chamado.tempo_resolucao_horas != null && (
              <Info rotulo="Tempo de resolução" valor={`${chamado.tempo_resolucao_horas} h`} />
            )}
          </div>

          {ehEquipe && (
            <PainelGerenciar
              chamado={chamado}
              opcoes={opcoes}
              tecnicos={tecnicos}
              aoSalvar={carregar}
              setMsg={setMsg}
              meuId={usuario.id}
            />
          )}

          <div className="bloco">
            <div className="bloco-titulo"><Icone nome="relogio" /> Histórico</div>
            {chamado.historico.length === 0 ? (
              <p className="texto-suave small">Sem registros.</p>
            ) : (
              <ul className="timeline">
                {chamado.historico.map((h, i) => (
                  <li key={h.id} className={i === chamado.historico.length - 1 ? "fim" : ""}>
                    <div className="tl-acao">{h.acao}</div>
                    <div className="tl-data">{formatarData(h.criado_em)} · {tempoRelativo(h.criado_em)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Info({ rotulo, valor }) {
  return (
    <div className="mb-2">
      <div className="texto-suave small">{rotulo}</div>
      <div className="fw-bold">{valor || "—"}</div>
    </div>
  );
}

function Comentarios({ chamado, aoEnviar, setMsg }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await api.post(`/chamados/${chamado.id}/comentar`, { texto });
      setTexto("");
      setMsg("Comentário adicionado.");
      await aoEnviar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="bloco">
      <div className="bloco-titulo">
        <Icone nome="chat" /> Comentários
        <span className="texto-suave small" style={{ marginLeft: ".4rem", fontWeight: 600 }}>
          ({chamado.comentarios.length})
        </span>
      </div>

      {chamado.comentarios.length === 0 ? (
        <p className="texto-suave small">Ainda não há comentários neste chamado.</p>
      ) : (
        <div className="mb-2">
          {chamado.comentarios.map((co) => {
            const equipe = co.autor?.tipo === "tecnico" || co.autor?.tipo === "admin";
            return (
              <div className="comentario" key={co.id}>
                <Avatar nome={co.autor?.nome} equipe={equipe} />
                <div>
                  <div className="flex items-center" style={{ gap: ".5rem" }}>
                    <strong>{co.autor?.nome || "Usuário removido"}</strong>
                    {equipe && <span className="badge danger" style={{ fontSize: ".62rem" }}>Suporte</span>}
                    <span className="texto-suave small">· {tempoRelativo(co.criado_em)}</span>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", marginTop: ".2rem" }}>{co.texto}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={enviar} className="mt-2">
        <textarea
          className="form-control"
          rows={3}
          placeholder="Escreva uma resposta ou comentário..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button className="btn btn-primary mt-2" disabled={enviando || !texto.trim()}>
          <Icone nome="enviar" /> {enviando ? "Enviando..." : "Comentar"}
        </button>
      </form>
    </div>
  );
}

function PainelGerenciar({ chamado, opcoes, tecnicos, aoSalvar, setMsg, meuId }) {
  const [form, setForm] = useState({
    status: chamado.status,
    prioridade: chamado.prioridade,
    tecnico_id: chamado.tecnico?.id ?? "",
    solucao_final: chamado.solucao_final || "",
  });
  const [salvando, setSalvando] = useState(false);
  const [assumindo, setAssumindo] = useState(false);

  // ressincroniza quando o chamado é recarregado
  useEffect(() => {
    setForm({
      status: chamado.status,
      prioridade: chamado.prioridade,
      tecnico_id: chamado.tecnico?.id ?? "",
      solucao_final: chamado.solucao_final || "",
    });
  }, [chamado]);

  function mudar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function assumir() {
    setAssumindo(true);
    try {
      await api.post(`/chamados/${chamado.id}/assumir`);
      setMsg("Você assumiu este chamado.");
      await aoSalvar();
    } finally {
      setAssumindo(false);
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await api.patch(`/chamados/${chamado.id}/gerenciar`, {
        status: form.status,
        prioridade: form.prioridade,
        tecnico_id: form.tecnico_id === "" ? null : Number(form.tecnico_id),
        solucao_final: form.solucao_final,
      });
      setMsg("Chamado atualizado com sucesso.");
      await aoSalvar();
    } finally {
      setSalvando(false);
    }
  }

  const souResponsavel = chamado.tecnico?.id === meuId;

  return (
    <div className="bloco mb-3" style={{ borderTop: "3px solid var(--vinho)" }}>
      <div className="bloco-titulo" style={{ color: "var(--vinho)" }}>
        <Icone nome="escudo" /> Gerenciar (equipe)
      </div>

      {!souResponsavel && (
        <button className="btn btn-vinho w-100 mb-2" onClick={assumir} disabled={assumindo}>
          <Icone nome="check" /> {assumindo ? "Assumindo..." : "Assumir este chamado"}
        </button>
      )}

      <form onSubmit={salvar}>
        <div className="form-grupo">
          <label className="form-label">Status</label>
          <select className="form-select" name="status" value={form.status} onChange={mudar}>
            {opcoes?.status.map((s) => <option key={s.valor} value={s.valor}>{s.label}</option>)}
          </select>
        </div>
        <div className="form-grupo">
          <label className="form-label">Prioridade</label>
          <select className="form-select" name="prioridade" value={form.prioridade} onChange={mudar}>
            {opcoes?.prioridades.map((p) => <option key={p.valor} value={p.valor}>{p.label}</option>)}
          </select>
        </div>
        <div className="form-grupo">
          <label className="form-label">Técnico responsável</label>
          <select className="form-select" name="tecnico_id" value={form.tecnico_id} onChange={mudar}>
            <option value="">— Sem técnico —</option>
            {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
        <div className="form-grupo">
          <label className="form-label">Solução aplicada</label>
          <textarea
            className="form-control"
            name="solucao_final"
            rows={3}
            placeholder="Descreva a solução (preenchido ao resolver)."
            value={form.solucao_final}
            onChange={mudar}
          />
        </div>
        <button className="btn btn-primary w-100" disabled={salvando}>
          <Icone nome="check" /> {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
