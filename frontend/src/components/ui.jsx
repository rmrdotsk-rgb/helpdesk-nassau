import { Link } from "react-router-dom";
import Icone from "./Icone";
import { iniciais } from "../api";

// Badges de status e prioridade (a cor vem do backend)
export function BadgeStatus({ chamado }) {
  return <span className={"badge " + chamado.status_cor}>{chamado.status_label}</span>;
}
export function BadgePrioridade({ chamado }) {
  return <span className={"badge " + chamado.prioridade_cor}>{chamado.prioridade_label}</span>;
}

// Card de chamado usado nas listas e dashboards
export function ChamadoCard({ chamado }) {
  return (
    <Link to={`/chamados/${chamado.id}`} className={"chamado-card" + (chamado.is_urgente ? " urgente" : "")}>
      {chamado.is_urgente && <span className="fita-urgente">URGENTE</span>}
      <div className="flex items-center justify-between" style={{ gap: ".5rem" }}>
        <span className="num">#{chamado.id}</span>
        <BadgeStatus chamado={chamado} />
      </div>
      <h3>{chamado.titulo}</h3>
      <div className="flex flex-wrap" style={{ gap: ".4rem" }}>
        <span className="cat-tag"><Icone nome="tag" /> {chamado.categoria_label}</span>
        <BadgePrioridade chamado={chamado} />
      </div>
      <div className="meta">
        <span><Icone nome="pessoa" /> {chamado.solicitante?.nome || "—"}</span>
        <span><Icone nome="local" /> {chamado.localizacao_label}</span>
        {chamado.esta_atrasado && <span className="atrasado-dot">atrasado</span>}
      </div>
    </Link>
  );
}

export function Carregando() {
  return (
    <div className="carregando-tela">
      <div className="spinner" />
    </div>
  );
}

export function Vazio({ titulo = "Nada por aqui", texto = "" }) {
  return (
    <div className="vazio">
      <Icone nome="vazio" className="icone" />
      <h3 style={{ fontSize: "1.1rem" }}>{titulo}</h3>
      {texto && <p className="texto-suave">{texto}</p>}
    </div>
  );
}

export function Alerta({ tipo = "info", children }) {
  if (!children) return null;
  const ico = tipo === "sucesso" ? "check" : tipo === "erro" ? "alerta" : "alerta";
  return (
    <div className={"alerta-msg " + tipo}>
      <Icone nome={ico} /> <span>{children}</span>
    </div>
  );
}

// Barras de estatística (categoria/status/prioridade)
export function Barras({ dados, vinho = false }) {
  return (
    <div>
      {dados.map((d) => (
        <div className="barra-linha" key={d.chave}>
          <div className="barra-rotulo">{d.label}</div>
          <div className="barra-track">
            <div className={"barra-fill" + (vinho ? " vinho" : "")} style={{ width: d.pct + "%" }} />
          </div>
          <div className="barra-valor">{d.valor}</div>
        </div>
      ))}
    </div>
  );
}

// Avatar circular com iniciais
export function Avatar({ nome, equipe = false }) {
  return <div className={"avatar" + (equipe ? " equipe" : "")}>{iniciais(nome)}</div>;
}
