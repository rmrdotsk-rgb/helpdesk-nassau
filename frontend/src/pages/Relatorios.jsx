import { useEffect, useState } from "react";
import Icone from "../components/Icone";
import { Barras, BadgeStatus, Carregando, Vazio } from "../components/ui";
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

export default function Relatorios() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/relatorios").then(setDados).catch((e) => setErro(e.message));
  }, []);

  if (erro) return <div className="bloco"><Vazio titulo="Erro" texto={erro} /></div>;
  if (!dados) return <Carregando />;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Análise</div>
          <h1>Relatórios</h1>
          <p className="texto-suave small">Gerado em {formatarData(dados.gerado_em)}</p>
        </div>
        <button className="btn btn-claro nao-imprimir" onClick={() => window.print()}>
          <Icone nome="imprimir" /> Imprimir
        </button>
      </div>

      <div className="grid grid-3 mb-3">
        <Stat icone="ticket" num={dados.total} rotulo="Total de chamados" />
        <Stat icone="check" num={dados.qtd_resolvidos} rotulo="Resolvidos" variante="ok" />
        <Stat
          icone="relogio"
          num={dados.tempo_medio != null ? `${dados.tempo_medio}h` : "—"}
          rotulo="Tempo médio de resolução"
          variante="alerta"
        />
      </div>

      <div className="grid grid-3 mb-3">
        <div className="bloco">
          <div className="bloco-titulo"><Icone nome="tag" /> Por categoria</div>
          <Barras dados={dados.por_categoria} />
        </div>
        <div className="bloco">
          <div className="bloco-titulo"><Icone nome="dashboard" /> Por status</div>
          <Barras dados={dados.por_status} vinho />
        </div>
        <div className="bloco">
          <div className="bloco-titulo"><Icone nome="raio" /> Por prioridade</div>
          <Barras dados={dados.por_prioridade} />
        </div>
      </div>

      <div className="bloco">
        <div className="bloco-titulo"><Icone nome="check" /> Últimos chamados resolvidos</div>
        {dados.resolvidos_recentes.length === 0 ? (
          <Vazio titulo="Nenhum chamado resolvido ainda" />
        ) : (
          <div className="tabela-wrap">
            <table className="tabela-nassau">
              <thead>
                <tr><th>#</th><th>Título</th><th>Técnico</th><th>Resolvido em</th><th className="text-end">Tempo</th></tr>
              </thead>
              <tbody>
                {dados.resolvidos_recentes.map((ch) => (
                  <tr key={ch.id}>
                    <td className="fw-bold">#{ch.id}</td>
                    <td style={{ maxWidth: 280 }}>{ch.titulo}</td>
                    <td>{ch.tecnico?.nome || "—"}</td>
                    <td className="small">{formatarData(ch.data_resolucao, false)}</td>
                    <td className="text-end fw-bold">
                      {ch.tempo_resolucao_horas != null ? `${ch.tempo_resolucao_horas}h` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
