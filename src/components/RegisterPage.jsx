// src/components/RegisterPage.jsx
import { useState } from "react";
import { API_AUTH_BASE, apiFetch } from "../Service/apiHelper";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [msg, setMsg] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await apiFetch(`${API_AUTH_BASE}/register`, {
        method: "POST",
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          puesto: "Cliente", // 👈 para que entre a ROLE_CLIENTE
        }),
      });
      setMsg("Usuario registrado, ahora puedes iniciar sesión.");
    } catch (err) {
      setMsg(err.message || "Error al registrar.");
    }
  };

  return (
    <div className="container py-4">
      <h2>Registro de cliente</h2>

      {msg && <div className="alert alert-info mt-2">{msg}</div>}

      <form onSubmit={handleSubmit} className="mt-3">
        <div className="mb-2">
          <label className="form-label">Correo / usuario</label>
          <input
            type="text"
            name="username"
            className="form-control"
            value={form.username}
            onChange={handleChange}
          />
        </div>

        <div className="mb-2">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <button className="btn btn-primary mt-2">Registrarme</button>
      </form>
    </div>
  );
}
