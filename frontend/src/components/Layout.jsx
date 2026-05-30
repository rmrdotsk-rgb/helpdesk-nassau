import { Navigate, Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../auth";
import { Carregando } from "./ui";

// Layout das páginas internas: navbar + conteúdo + rodapé
export function LayoutApp() {
  return (
    <>
      <Navbar />
      <main className="conteudo">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="rodape">
        <div className="container flex flex-wrap items-center justify-between" style={{ gap: ".5rem" }}>
          <span>HelpDesk Nassau — Sistema de Chamados Técnicos</span>
          <span className="texto-suave">Projeto acadêmico · UNINASSAU</span>
        </div>
      </footer>
    </>
  );
}

// Protege rotas: exige login; opcionalmente exige equipe ou admin.
export function RotaProtegida({ exige }) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) return <Carregando />;
  if (!usuario) return <Navigate to="/login" state={{ from: location }} replace />;

  if (exige === "admin" && !usuario.is_admin) return <SemPermissao />;
  if (exige === "equipe" && !usuario.is_equipe) return <SemPermissao />;

  return <Outlet />;
}

function SemPermissao() {
  return (
    <div className="container" style={{ padding: "3rem 0" }}>
      <div className="bloco text-center">
        <h1 style={{ fontSize: "1.5rem" }}>403 — Acesso restrito</h1>
        <p className="texto-suave">Você não tem permissão para acessar esta área.</p>
      </div>
    </div>
  );
}
