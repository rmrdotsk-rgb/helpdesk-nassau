import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Ao montar, se há token salvo, recupera o usuário.
  useEffect(() => {
    async function carregar() {
      if (!getToken()) {
        setCarregando(false);
        return;
      }
      try {
        const u = await api.get("/auth/me");
        setUsuario(u);
      } catch {
        setToken(null);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  async function login(username, password) {
    const r = await api.post("/auth/login", { username, password });
    setToken(r.access_token);
    setUsuario(r.usuario);
    return r.usuario;
  }

  async function registrar(dados) {
    const r = await api.post("/auth/register", dados);
    setToken(r.access_token);
    setUsuario(r.usuario);
    return r.usuario;
  }

  function logout() {
    setToken(null);
    setUsuario(null);
  }

  function atualizarUsuario(u) {
    setUsuario(u);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, registrar, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
