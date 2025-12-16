// src/components/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const resp = await login({ username, password });
      console.log("Respuesta login backend:", resp);

      // intenta detectar el token en la respuesta
      const token =
        resp.token ||
        resp.jwt ||
        resp.accessToken ||
        null;

      // ⬇️ aquí ya NO armamos userData a mano,
      // se lo pasamos tal cual al AuthContext
      loginUser(resp, token);

      // Redirigir a la pantalla que quieras después de login
      navigate("/clientes"); // o "/", "/ventas", etc.
    } catch (err) {
      console.error("Error en login:", err);
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div className="card p-4 shadow-sm" style={{ minWidth: 380 }}>
        <h3 className="mb-3 text-center">Iniciar sesión</h3>

        {error && (
          <div className="alert alert-danger py-2 small mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Usuario</label>
            <input
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button className="btn btn-primary w-100">
            Entrar
          </button>
        </form>

        <div className="mt-3 text-center">
          <span className="text-muted">¿Aún no tienes cuenta?</span>{" "}
          <button
            type="button"
            className="btn btn-link p-0 ms-1"
            onClick={() => navigate("/registro")}
          >
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
