import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icone from "../components/Icone";
import { Barras, Carregando, ChamadoCard, Vazio } from "../components/ui";
import { useAuth } from "../auth";
import { api } from "../api";

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

export default function Dashboard() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/dashboard").then(setDados).catch((e) => setErro(e.message));
  }, []);

  if (erro) return <div className="bloco"><Vazio titulo="Erro ao carregar" texto={erro} /></div>;
  if (!dados) return <Carregando />;

  const primeiroNome = usuario?.nome?.split(" ")[0];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Painel inicial</div>
          <h1>Olá, {primeiroNome} 👋</h1>
        </div>
        <Link to="/chamados/novo" className="btn btn-vinho nao-imprimir">
          <Icone nome="mais" /> Abrir chamado
        </Link>
      </div>

      {dados.perfil === "admin" && <DashAdmin d={dados} />}
      {dados.perfil === "tecnico" && <DashTecnico d={dados} />}
      {dados.perfil === "comum" && <DashComum d={dados} />}
    </>
  );
}

function DashAdmin({ d }) {
  return (
    <>
      <div className="grid grid-4 mb-3">
        <div className="surge d1"><Stat icone="ticket" num={d.total} rotulo="Total de chamados" /></div>
        <div className="surge d2"><Stat icone="relogio" num={d.abertos} rotulo="Em aberto" variante="alerta" /></div>
        <div className="surge d3"><Stat icone="raio" num={d.urgentes} rotulo="Urgentes abertos" variante="vinho" /></div>
        <div className="surge d4"><Stat icone="check" num={d.resolvidos} rotulo="Resolvidos" variante="ok" /></div>
      </div>

      <div className="grid grid-2 mb-3">
        <div className="bloco">
          <div className="bloco-titulo"><Icone nome="tag" /> Por categoria</div>
          <Barras dados={d.por_categoria} />
        </div>
        <div className="bloco">
          <div className="bloco-titulo"><Icone nome="dashboard" /> Por status</div>
          <Barras dados={d.por_status} vinho />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="bloco">
          <div className="bloco-titulo"><Icone nome="lista" /> Chamados recentes</div>
          {d.recentes.length === 0 ? <Vazio /> : (
            <div className="grid" style={{ gap: ".8rem" }}>
              {d.recentes.map((ch) => <ChamadoCard key={ch.id} chamado={ch} />)}
            </div>
          )}
        </div>
        <div className="bloco">
          <div className="bloco-titulo"><Icone nome="estrela" /> Técnicos com mais resoluções</div>
          {d.tecnicos_top.length === 0 ? <Vazio /> : (
            <div className="tabela-wrap">
              <table className="tabela-nassau">
                <thead><tr><th>Técnico</th><th className="text-end">Resolvidos</th></tr></thead>
                <tbody>
                  {d.tecnicos_top.map((t, i) => (
                    <tr key={i}><td>{t.nome}</td><td className="text-end fw-bold">{t.atendidos}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DashTecnico({ d }) {
  return (
    <>
      <div className="grid grid-4 mb-3">
        <div className="surge d1"><Stat icone="ticket" num={d.atribuidos} rotulo="Atribuídos a mim" /></div>
        <div className="surge d2"><Stat icone="raio" num={d.urgentes} rotulo="Urgentes" variante="vinho" /></div>
        <div className="surge d3"><Stat icone="relogio" num={d.em_atendimento} rotulo="Em atendimento" variante="alerta" /></div>
        <div className="surge d4"><Stat icone="check" num={d.resolvidos_mes} rotulo="Resolvidos no mês" variante="ok" /></div>
      </div>

      <div className="grid grid-2">
        <div className="bloco">
          <div className="bloco-titulo">
            <Icone nome="alerta" /> Fila sem técnico
            {d.sem_tecnico > 0 && <span className="badge danger" style={{ marginLeft: ".4rem" }}>{d.sem_tecnico}</span>}
          </div>
          {d.fila.length === 0 ? <Vazio titulo="Fila vazia" texto="Nenhum chamado aguardando atribuição." /> : (
            <div className="grid" style={{ gap: ".8rem" }}>
              {d.fila.map((ch) => <ChamadoCard key={ch.id} chamado={ch} />)}
            </div>
          )}
        </div>
        <div className="bloco">
          <div className="bloco-titulo"><Icone nome="lista" /> Meus chamados em aberto</div>
          {d.meus_recentes.length === 0 ? <Vazio titulo="Tudo em dia" texto="Você não tem chamados em aberto." /> : (
            <div className="grid" style={{ gap: ".8rem" }}>
              {d.meus_recentes.map((ch) => <ChamadoCard key={ch.id} chamado={ch} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DashComum({ d }) {
  return (
    <>
      <div className="grid grid-4 mb-3">
        <div className="surge d1"><Stat icone="ticket" num={d.total} rotulo="Total" /></div>
        <div className="surge d2"><Stat icone="relogio" num={d.abertos} rotulo="Abertos" variante="alerta" /></div>
        <div className="surge d3"><Stat icone="chat" num={d.em_andamento} rotulo="Em andamento" /></div>
        <div className="surge d4"><Stat icone="check" num={d.resolvidos} rotulo="Resolvidos" variante="ok" /></div>
      </div>

      <div className="bloco">
        <div className="bloco-titulo flex items-center justify-between">
          <span className="flex items-center" style={{ gap: ".5rem" }}><Icone nome="lista" /> Meus chamados</span>
          <Link to="/chamados" className="btn btn-claro btn-sm">Ver todos</Link>
        </div>
        {d.ultimos.length === 0 ? (
          <Vazio titulo="Você ainda não abriu chamados" texto="Clique em 'Abrir chamado' para começar." />
        ) : (
          <div className="grid grid-3" style={{ gap: ".8rem" }}>
            {d.ultimos.map((ch) => <ChamadoCard key={ch.id} chamado={ch} />)}
          </div>
        )}
      </div>
    </>
  );
}
