import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icone from "../components/Icone";
import { Alerta } from "../components/ui";
import { api } from "../api";

export default function NovoChamado() {
  const navigate = useNavigate();
  const [opcoes, setOpcoes] = useState(null);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    categoria: "outro",
    prioridade: "media",
    localizacao: "outro",
  });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get("/opcoes").then(setOpcoes).catch(() => {});
  }, []);

  function mudar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const ch = await api.post("/chamados", form);
      navigate(`/chamados/${ch.id}`);
    } catch (err) {
      setErro(err.message || "Não foi possível abrir o chamado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Chamados</div>
          <h1>Abrir novo chamado</h1>
        </div>
        <button className="btn btn-claro" onClick={() => navigate(-1)}><Icone nome="voltar" /> Voltar</button>
      </div>

      <div className="row">
        <div className="col" style={{ maxWidth: 720 }}>
          <div className="bloco">
            <Alerta tipo="erro">{erro}</Alerta>
            <form onSubmit={enviar}>
              <div className="form-grupo">
                <label className="form-label">Título <span className="req">*</span></label>
                <input
                  className="form-control"
                  name="titulo"
                  value={form.titulo}
                  onChange={mudar}
                  placeholder="Resuma o problema em poucas palavras"
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-grupo">
                <label className="form-label">Descrição <span className="req">*</span></label>
                <textarea
                  className="form-control"
                  name="descricao"
                  value={form.descricao}
                  onChange={mudar}
                  rows={5}
                  placeholder="Descreva o problema com detalhes..."
                  required
                />
              </div>

              <div className="row">
                <div className="col form-grupo">
                  <label className="form-label">Categoria</label>
                  <select className="form-select" name="categoria" value={form.categoria} onChange={mudar}>
                    {opcoes?.categorias.map((c) => <option key={c.valor} value={c.valor}>{c.label}</option>)}
                  </select>
                </div>
                <div className="col form-grupo">
                  <label className="form-label">Prioridade</label>
                  <select className="form-select" name="prioridade" value={form.prioridade} onChange={mudar}>
                    {opcoes?.prioridades.map((p) => <option key={p.valor} value={p.valor}>{p.label}</option>)}
                  </select>
                </div>
                <div className="col form-grupo">
                  <label className="form-label">Localização</label>
                  <select className="form-select" name="localizacao" value={form.localizacao} onChange={mudar}>
                    {opcoes?.locais.map((l) => <option key={l.valor} value={l.valor}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <button className="btn btn-vinho btn-lg" disabled={enviando}>
                <Icone nome="enviar" /> {enviando ? "Enviando..." : "Abrir chamado"}
              </button>
            </form>
          </div>
        </div>

        <div className="col" style={{ maxWidth: 340 }}>
          <div className="bloco">
            <div className="bloco-titulo"><Icone nome="alerta" /> Dicas</div>
            <ul className="texto-suave small" style={{ paddingLeft: "1.1rem", lineHeight: 1.7 }}>
              <li>Seja específico no título.</li>
              <li>Inclua mensagens de erro, se houver.</li>
              <li>Informe o local exato do equipamento.</li>
              <li>Use a prioridade <strong>Urgente</strong> só quando algo estiver totalmente parado.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
