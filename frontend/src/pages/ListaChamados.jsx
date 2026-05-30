import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icone from "../components/Icone";
import { Carregando, ChamadoCard, Vazio } from "../components/ui";
import { useAuth } from "../auth";
import { api } from "../api";

export default function ListaChamados() {
  const { usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const [opcoes, setOpcoes] = useState(null);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // estado dos filtros (espelha a querystring)
  const status = params.get("status") || "";
  const prioridade = params.get("prioridade") || "";
  const categoria = params.get("categoria") || "";
  const q = params.get("q") || "";
  const ordem = params.get("ordem") || "recentes";
  const filtro = params.get("filtro") || "";
  const page = parseInt(params.get("page") || "1", 10);

  const [buscaLocal, setBuscaLocal] = useState(q);

  useEffect(() => {
    api.get("/opcoes").then(setOpcoes).catch(() => {});
  }, []);

  useEffect(() => {
    setCarregando(true);
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (prioridade) qs.set("prioridade", prioridade);
    if (categoria) qs.set("categoria", categoria);
    if (q) qs.set("q", q);
    if (ordem) qs.set("ordem", ordem);
    if (filtro) qs.set("filtro", filtro);
    qs.set("page", page);
    qs.set("page_size", 9);
    api
      .get("/chamados?" + qs.toString())
      .then(setDados)
      .finally(() => setCarregando(false));
  }, [status, prioridade, categoria, q, ordem, filtro, page]);

  function setFiltro(chave, valor) {
    const novo = new URLSearchParams(params);
    if (valor) novo.set(chave, valor);
    else novo.delete(chave);
    novo.delete("page"); // volta pra página 1 ao mudar filtro
    setParams(novo);
  }

  function aplicarBusca(e) {
    e.preventDefault();
    setFiltro("q", buscaLocal.trim());
  }

  function limpar() {
    setBuscaLocal("");
    setParams({});
  }

  function irPara(p) {
    const novo = new URLSearchParams(params);
    novo.set("page", p);
    setParams(novo);
  }

  const filtrosRapidos = [
    { chave: "", label: "Todos" },
    { chave: "abertos", label: "Em aberto" },
    { chave: "urgentes", label: "Urgentes" },
    { chave: "meus", label: usuario?.is_equipe ? "Atribuídos a mim" : "Meus" },
  ];
  if (usuario?.is_equipe) filtrosRapidos.push({ chave: "sem_tecnico", label: "Sem técnico" });

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Chamados</div>
          <h1>Lista de chamados</h1>
        </div>
        <Link to="/chamados/novo" className="btn btn-vinho"><Icone nome="mais" /> Novo chamado</Link>
      </div>

      {/* filtros rápidos */}
      <div className="flex flex-wrap mb-2" style={{ gap: ".5rem" }}>
        {filtrosRapidos.map((f) => (
          <button
            key={f.chave}
            className={"btn btn-sm " + (filtro === f.chave ? "btn-primary" : "btn-claro")}
            onClick={() => setFiltro("filtro", f.chave)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* barra de filtros */}
      <div className="bloco mb-3">
        <div className="row" style={{ rowGap: ".8rem", alignItems: "end" }}>
          <div className="col" style={{ minWidth: 200 }}>
            <label className="form-label">Buscar</label>
            <form onSubmit={aplicarBusca} className="flex" style={{ gap: ".4rem" }}>
              <input
                className="form-control"
                placeholder="Título ou descrição..."
                value={buscaLocal}
                onChange={(e) => setBuscaLocal(e.target.value)}
              />
              <button className="btn btn-primary" type="submit"><Icone nome="busca" /></button>
            </form>
          </div>
          <div className="col" style={{ minWidth: 140 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={(e) => setFiltro("status", e.target.value)}>
              <option value="">Todos</option>
              {opcoes?.status.map((s) => <option key={s.valor} value={s.valor}>{s.label}</option>)}
            </select>
          </div>
          <div className="col" style={{ minWidth: 140 }}>
            <label className="form-label">Prioridade</label>
            <select className="form-select" value={prioridade} onChange={(e) => setFiltro("prioridade", e.target.value)}>
              <option value="">Todas</option>
              {opcoes?.prioridades.map((p) => <option key={p.valor} value={p.valor}>{p.label}</option>)}
            </select>
          </div>
          <div className="col" style={{ minWidth: 140 }}>
            <label className="form-label">Categoria</label>
            <select className="form-select" value={categoria} onChange={(e) => setFiltro("categoria", e.target.value)}>
              <option value="">Todas</option>
              {opcoes?.categorias.map((c) => <option key={c.valor} value={c.valor}>{c.label}</option>)}
            </select>
          </div>
          <div className="col" style={{ minWidth: 140 }}>
            <label className="form-label">Ordenar</label>
            <select className="form-select" value={ordem} onChange={(e) => setFiltro("ordem", e.target.value)}>
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
              <option value="atualizado">Última atualização</option>
            </select>
          </div>
        </div>
        <div className="mt-2">
          <button className="btn btn-claro btn-sm" onClick={limpar}><Icone nome="filtro" /> Limpar filtros</button>
        </div>
      </div>

      {/* resultados */}
      {carregando ? (
        <Carregando />
      ) : !dados || dados.itens.length === 0 ? (
        <div className="bloco"><Vazio titulo="Nenhum chamado encontrado" texto="Tente ajustar os filtros de busca." /></div>
      ) : (
        <>
          <p className="texto-suave small mb-2">{dados.total} chamado(s) encontrado(s)</p>
          <div className="grid grid-3" style={{ gap: ".8rem" }}>
            {dados.itens.map((ch) => <ChamadoCard key={ch.id} chamado={ch} />)}
          </div>

          {dados.pages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <button className="btn btn-claro btn-sm" disabled={page <= 1} onClick={() => irPara(page - 1)}>
                <Icone nome="voltar" /> Anterior
              </button>
              <span className="texto-suave small">Página {dados.page} de {dados.pages}</span>
              <button className="btn btn-claro btn-sm" disabled={page >= dados.pages} onClick={() => irPara(page + 1)}>
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
