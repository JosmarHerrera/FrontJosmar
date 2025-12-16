// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "user";

// 🔧 Función para normalizar el usuario que viene del backend
const normalizeUser = (raw = {}) => {
  return {
    username: raw.username || raw.userName || raw.nombreUsuario || "",
    roles: raw.roles || raw.authorities || [],
    // aquí intentamos varias claves posibles por si el backend usa otro nombre
    idUsuario:
      raw.idUsuario ??
      raw.id_usuario ??
      raw.id_usuario_fk ?? // por si lo tuvieras así
      raw.id ??
      null,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { username, roles, idUsuario }
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar de localStorage al refrescar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalized = normalizeUser(parsed);

        // si al menos tiene username, lo damos por válido
        if (normalized.username) {
          setUser(normalized);
          setIsAuthenticated(true);
        } else {
          // si está raro, limpiamos
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Error leyendo user de localStorage:", e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /**
   * loginUser debe recibir JUSTO la respuesta del backend de login,
   * por ejemplo:
   *   { idUsuario: 8, username: 'admin1', roles: ['ROLE_ADMIN'] }
   */
  const loginUser = (backendUserData, token) => {
    if (token) {
      localStorage.setItem("token", token);
    }

    const userData = normalizeUser(backendUserData);

    console.log("Usuario guardado en contexto:", userData);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
