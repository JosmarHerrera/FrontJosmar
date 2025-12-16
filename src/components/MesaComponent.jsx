// src/components/MesaComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listarMesas,
  crearMesa,
  actualizarMesa,
  eliminarMesa,
} from "../services/api";

const OPCIONES_UBICACION = [
  "Terraza",
  "Interior planta baja",
  "Interior planta alta",
];

export const MesaComponent = () => {
  const [mesas, setMesas] = useState([]);
  const [modoEditar, setModoEditar] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    idMesa: null,
    numero: "",
    capacidad: "",
    ubicacion: "",
  });

  useEffect(() => {
    cargarMesas();
  }, []);

  const cargarMesas = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listarMesas(); // microservicio reservaciones
      setMesas(data ?? []);
    } catch (err) {
      console.error("Error cargando mesas:", err);
      setError(err?.message || "No se pudieron cargar las mesas");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () =>
    setForm({ idMesa: null, numero: "", capacidad: "", ubicacion: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.numero || !form.capacidad || !form.ubicacion) {
      setError("Completa número, capacidad y ubicación.");
      return;
    }

    const payload = {
      numero: Number(form.numero),
      capacidad: Number(form.capacidad),
      ubicacion: form.ubicacion, // viene del select fijo
    };

    if (isNaN(payload.numero) || isNaN(payload.capacidad)) {
      setError("Número y capacidad deben ser valores numéricos válidos.");
      return;
    }

    setSaving(true);
    try {
      if (modoEditar) {
        await actualizarMesa(form.idMesa, payload);
        alert("✅ Mesa actualizada");
      } else {
        await crearMesa(payload);
        alert("✅ Mesa creada");
      }
      resetForm();
      setModoEditar(false);
      await cargarMesas();
    } catch (err) {
      console.error("Error guardando mesa:", err);
      setError(err?.message || "Ocurrió un error al guardar la mesa");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (mesa) => {
    setForm({
      idMesa: mesa.idMesa,
      numero: mesa.numero,
      capacidad: mesa.capacidad,
      ubicacion: mesa.ubicacion ?? "",
    });
    setModoEditar(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta mesa?")) return;
    try {
      await eliminarMesa(id);
      await cargarMesas();
      alert("🗑️ Mesa eliminada");
    } catch (err) {
      console.error("Error eliminando mesa:", err);
      setError(err?.message || "No se pudo eliminar la mesa");
    }
  };

  const mesasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return (mesas ?? [])
      .filter(
        (m) =>
          String(m.numero).includes(q) ||
          String(m.capacidad).includes(q) ||
          (m.ubicacion ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => a.numero - b.numero);
  }, [mesas, busqueda]);

  return (
    <div className="container py-4">
      {/* Header + buscador */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="m-0 fw-bold">Mesas</h2>
          <small className="text-body-secondary">
            Administra el número, capacidad y ubicación de las mesas.
          </small>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <div className="input-group input-group-sm" style={{ minWidth: 260 }}>
            <span className="input-group-text">🔎</span>
            <input
              type="text"
              placeholder="Buscar por número, capacidad o ubicación…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="form-control"
            />
            {busqueda && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setBusqueda("")}
              >
                Limpiar
              </button>
            )}
          </div>
          <span className="badge bg-secondary-subtle text-secondary-emphasis align-self-center">
            {mesasFiltradas.length} / {mesas.length} registradas
          </span>
        </div>
      </div>

      {/* Errores */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <span className="me-2">⚠️</span> {error}
        </div>
      )}

      {/* Form + listado */}
      <div className="row g-3 mb-4">
        {/* Formulario */}
        <div className="col-12 col-lg-4">
          <form onSubmit={handleSubmit} className="card p-3 shadow-sm">
            <h5 className="fw-semibold mb-3">
              {modoEditar ? "Editar mesa" : "Agregar mesa"}
            </h5>

            <div className="mb-2">
              <label className="form-label">Número de Mesa *</label>
              <input
                type="number"
                min="1"
                name="numero"
                className="form-control"
                placeholder="Ej. 12"
                value={form.numero}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Capacidad *</label>
              <input
                type="number"
                min="1"
                name="capacidad"
                className="form-control"
                placeholder="Ej. 4"
                value={form.capacidad}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Ubicación *</label>
              <select
                name="ubicacion"
                className="form-select"
                value={form.ubicacion}
                onChange={handleChange}
                required
              >
                <option value="">-- Selecciona una ubicación --</option>
                {OPCIONES_UBICACION.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? "Guardando…"
                  : modoEditar
                  ? "Actualizar mesa"
                  : "Agregar mesa"}
              </button>
              {modoEditar && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    resetForm();
                    setModoEditar(false);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tarjetas + tabla */}
        <div className="col-12 col-lg-8">
          {loading ? (
            <div className="card p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="spinner-border" role="status" />
                <span>Cargando mesas…</span>
              </div>
            </div>
          ) : mesasFiltradas.length === 0 ? (
            <div className="card p-4 text-center text-body-secondary">
              No hay mesas que coincidan
            </div>
          ) : (
            <>
              {/* Grid mini-cards */}
              <div className="mini-grid mb-4">
                {mesasFiltradas.map((m) => (
                  <div key={m.idMesa} className="mini-card mini-dark">
                    <div className="mini-actions">
                      <button
                        className="mini-btn"
                        title="Editar"
                        onClick={() => handleEditar(m)}
                      >
                        ✏️
                      </button>
                      <button
                        className="mini-btn danger"
                        title="Eliminar"
                        onClick={() => handleEliminar(m.idMesa)}
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="mini-body">
                      <div className="mini-title text-bright">
                        Mesa Nº {m.numero}
                      </div>
                      <div className="mini-sub text-dim">
                        {m.ubicacion || "Sin ubicación"}
                      </div>
                      <div className="mini-row">
                        <span className="mini-badge">
                          {m.capacidad} personas
                        </span>
                        <span className="mini-badge">ID #{m.idMesa}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla clásica */}
              <div className="table-responsive surface-dark">
                <table className="table align-middle mb-0">
                <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Número</th>
                      <th>Capacidad</th>
                      <th>Ubicación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mesasFiltradas.map((m) => (
                      <tr key={m.idMesa}>
                        <td>#{m.idMesa}</td>
                        <td>
                          <span className="mini-badge">Nº {m.numero}</span>
                        </td>
                        <td>
                          <span className="mini-badge">
                            {m.capacidad} personas
                          </span>
                        </td>
                        <td>{m.ubicacion}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-light me-2"
                            onClick={() => handleEditar(m)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleEliminar(m.idMesa)}
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {mesasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          Sin resultados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MesaComponent;
