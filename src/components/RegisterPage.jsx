// src/components/RegisterPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_AUTH_BASE, apiFetch } from "../Service/apiHelper";

export default function RegisterPage() {
  const navigate = useNavigate();

  // IMPORTANTE: valores EXACTOS que espera tu switch en Spring
  const OPTIONS = [
    { label: "Cliente", value: "Cliente", tipo: "CLIENTE" },
    { label: "Mesero", value: "Mesero", tipo: "EMPLEADO" },
    { label: "Cajero", value: "Cajero", tipo: "EMPLEADO" },
    { label: "Supervisor", value: "Supervisor", tipo: "EMPLEADO" },
    { label: "Administrador", value: "Administrador", tipo: "EMPLEADO" },
  ];

  const [form, setForm] = useState({
    username: "",
    password: "",
    puesto: "Cliente",
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setSaving(true);

    try {
      const selected = OPTIONS.find((o) => o.value === form.puesto) || OPTIONS[0];

      // ✅ Elegimos endpoint según el tipo
      const url =
        selected.tipo === "EMPLEADO"
          ? `${API_AUTH_BASE}/register/empleado`
          : `${API_AUTH_BASE}/register`;

      await apiFetch(url, {
        method: "POST",
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          puesto: form.puesto, // ✅ "Administrador" etc.
        }),
      });

      setMsg("Usuario registrado exitosamente. Ahora puedes iniciar sesión.");
      setTimeout(() => navigate("/login"), 700);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al registrar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div className="card p-4 shadow-sm" style={{ minWidth: 380 }}>
        <h3 className="mb-3 text-center">Crear cuenta</h3>

        {msg && <div className="alert alert-success py-2 small mb-3">{msg}</div>}
        {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Correo / usuario</label>
            <input
              type="text"
              name="username"
              className="form-control"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Tipo de cuenta</label>
            <select
              name="puesto"
              className="form-select"
              value={form.puesto}
              onChange={handleChange}
            >
              {OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            
          </div>

          <button className="btn btn-primary w-100" disabled={saving}>
            {saving ? "Registrando…" : "Registrarme"}
          </button>

          <button
            type="button"
            className="btn btn-link w-100 mt-2"
            onClick={() => navigate("/login")}
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  );
}
