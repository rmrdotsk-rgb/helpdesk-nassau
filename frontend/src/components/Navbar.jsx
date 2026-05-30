import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Icone from "./Icone";
import { useAuth } from "../auth";
import { api } from "../api";

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [abertosCount, setAbertosCount] = useState(null);

  // Contador de chamados abertos (no escopo do usuário) exibido na navbar.
  useEffect(() => {
    let vivo = true;
    async function carregar() {
      try {
        const r = await api.get("/chamados?filtro=abertos&page_size=1");
        if (vivo) setAbertosCount(r.total);
      } catch {
        /* silencioso */
      }
    }
    carregar();
    return () => {
      vivo = false;
    };
  }, [usuario]);

  function sair() {
    logout();
    navigate("/login");
  }

  const fechar = () => setAberto(false);

  return (
    <nav className="navbar-nassau">
      <div className="container navbar-inner">
        <Link to="/dashboard" className="navbar-brand" onClick={fechar}>
          <span className="brand-mark"><Icone nome="ticket" /></span>
          HelpDesk Nassau
        </Link>

        <button className="navbar-toggler" onClick={() => setAberto((a) => !a)} aria-label="Menu">
          <Icone nome="lista" />
        </button>

        <div className={"nav-collapse" + (aberto ? " aberto" : "")} style={{ marginLeft: "auto" }}>
          <div className="nav-links">
            <NavLink to="/dashboard" className="nav-link" onClick={fechar}>
              <Icone nome="dashboard" /> Painel inicial
            </NavLink>
            <NavLink to="/chamados" className="nav-link" onClick={fechar}>
              <Icone nome="lista" /> Chamados
              {abertosCount != null && abertosCount > 0 && <span className="nav-badge">{abertosCount}</span>}
            </NavLink>
            <NavLink to="/chamados/novo" className="nav-link" onClick={fechar}>
              <Icone nome="mais" /> Novo chamado
            </NavLink>
            {usuario?.is_equipe && (
              <NavLink to="/relatorios" className="nav-link" onClick={fechar}>
                <Icone nome="relatorio" /> Relatórios
              </NavLink>
            )}
            {usuario?.is_admin && (
              <NavLink to="/painel" className="nav-link" onClick={fechar}>
                <Icone nome="painel" /> Painel admin
              </NavLink>
            )}
            <NavLink to="/perfil" className="nav-link" onClick={fechar}>
              <Icone nome="usuario" /> {usuario?.nome?.split(" ")[0]}
              <span className="chip-perfil">{usuario?.tipo_label}</span>
            </NavLink>
            <button className="nav-link" onClick={sair}>
              <Icone nome="sair" /> Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
