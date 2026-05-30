import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { LayoutApp, RotaProtegida } from "./components/Layout";

import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import ListaChamados from "./pages/ListaChamados";
import NovoChamado from "./pages/NovoChamado";
import DetalheChamado from "./pages/DetalheChamado";
import Relatorios from "./pages/Relatorios";
import Painel from "./pages/Painel";
import Perfil from "./pages/Perfil";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* protegidas (exigem login) dentro do layout com navbar */}
        <Route element={<RotaProtegida />}>
          <Route element={<LayoutApp />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chamados" element={<ListaChamados />} />
            <Route path="/chamados/novo" element={<NovoChamado />} />
            <Route path="/chamados/:id" element={<DetalheChamado />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>
        </Route>

        {/* exigem equipe (técnico ou admin) */}
        <Route element={<RotaProtegida exige="equipe" />}>
          <Route element={<LayoutApp />}>
            <Route path="/relatorios" element={<Relatorios />} />
          </Route>
        </Route>

        {/* exigem admin */}
        <Route element={<RotaProtegida exige="admin" />}>
          <Route element={<LayoutApp />}>
            <Route path="/painel" element={<Painel />} />
          </Route>
        </Route>

        {/* raiz e qualquer rota desconhecida vão para o dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
