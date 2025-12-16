// src/components/TipoProductoComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listarTipos,
  crearTipo,
  actualizarTipo,
  eliminarTipo,
} from "../services/api";

export default function TipoProductoComponent() {
  const [tipos, setTipos] = useState([]);
  const [form, setForm] = useState({ idTipo: null, tipo: "", descripcion: "" });
  const [modoEditar, setModoEditar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // UX extra
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("tipo"); // "tipo" | "idTipo"
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

  useEffect(() => {
    cargarTipos();
  }, []);

  const cargarTipos = async () => {
    try {
      const data = await listarTipos();
      setTipos(data ?? []);
      setError("");
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los tipos.");
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm({ idTipo: null, tipo: "", descripcion: "" });
    setModoEditar(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.tipo.trim()) {
      return alert("El nombre del tipo es obligatorio.");
    }
    if (form.tipo.length < 2) {
      return alert("El nombre del tipo debe tener al menos 2 caracteres.");
    }

    setSaving(true);
    try {
      const payload = {
        tipo: form.tipo.trim(),
        descripcion: form.descripcion.trim(),
      };

      if (modoEditar) {
        await actualizarTipo(form.idTipo, payload);
        alert("✅ Tipo actualizado");
      } else {
        await crearTipo(payload);
        alert("✅ Tipo creado");
      }
      resetForm();
      await cargarTipos();
    } catch (e) {
      console.error(e);
      alert("❌ Ocurrió un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (t) => {
    setForm({
      idTipo: t.idTipo,
      tipo: t.tipo ?? "",
      descripcion: t.descripcion ?? "",
    });
    setModoEditar(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este tipo?")) return;
    try {
      await eliminarTipo(id);
      alert("🗑️ Tipo eliminado");
      await cargarTipos();
    } catch (e) {
      console.error(e);
      alert("❌ No se pudo eliminar");
    }
  };

  // Filtro + orden
  const tiposFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    let data = (tipos ?? []).filter(
      (t) =>
        (t.tipo ?? "").toLowerCase().includes(q) ||
        (t.descripcion ?? "").toLowerCase().includes(q) ||
        String(t.idTipo).includes(q)
    );

    data.sort((a, b) => {
      const A =
        sortKey === "idTipo"
          ? Number(a[sortKey])
          : String(a[sortKey] ?? "").toLowerCase();
      const B =
        sortKey === "idTipo"
          ? Number(b[sortKey])
          : String(b[sortKey] ?? "").toLowerCase();
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [tipos, search, sortKey, sortDir]);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h1 className="h4 m-0">Tipos de producto</h1>
        <span className="badge bg-secondary-subtle text-secondary-emphasis ms-2">
          {tiposFiltrados.length} / {tipos.length}
        </span>

        <div className="ms-auto d-flex flex-wrap gap-2">
          {/* BUSCADOR -> texto negro */}
          <input
            type="text"
            className="form-control text-dark bg-white"
            style={{ minWidth: 220 }}
            placeholder="Buscar por ID, nombre o descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {/* SELECT FILTRO -> texto negro */}
          <select
            className="form-select text-dark bg-white"
            style={{ minWidth: 160 }}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="tipo">Ordenar por: Tipo</option>
            <option value="idTipo">Ordenar por: ID</option>
          </select>
          {/* BOTÓN ASC/DESC -> texto negro */}
          <button
            className="btn btn-outline-light"
            style={{ color: "#000" }}
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            title="Cambiar dirección"
          >
            {sortDir === "asc" ? "⬆️ Asc" : "⬇️ Desc"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="alert alert-danger d-flex align-items-center"
          role="alert"
        >
          <span className="me-2">⚠️</span> {error}
        </div>
      )}

      <div className="row g-3">
        {/* Formulario */}
        <div className="col-12 col-lg-4">
          <form onSubmit={handleSubmit} className="card p-3 shadow-sm card-dark">
            <div className="mb-2">
              <label className="form-label fw-semibold">
                Nombre del tipo *
              </label>
              <input
                type="text"
                name="tipo"
                placeholder="Ej. Bebidas"
                value={form.tipo}
                onChange={handleChange}
                required
                className="form-control text-dark bg-white"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Descripción</label>
              <input
                type="text"
                name="descripcion"
                placeholder="Opcional"
                value={form.descripcion}
                onChange={handleChange}
                className="form-control text-dark bg-white"
              />
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className={`btn ${modoEditar ? "btn-primary" : "btn-success"}`}
                disabled={saving}
              >
                {saving
                  ? "Guardando…"
                  : modoEditar
                  ? "Actualizar"
                  : "Agregar"}
              </button>
              {modoEditar && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={resetForm}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabla */}
        <div className="col-12 col-lg-8">
          <div className="card p-0 shadow-sm surface-dark">
            <div className="table-responsive">
              {/* TEXTO TABLA -> negro */}
              <table
                className="table align-middle mb-0"
                style={{ color: "#000" }}
              >
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: 90 }}>ID</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th style={{ width: 160 }} className="text-end">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tiposFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        No hay tipos registrados
                      </td>
                    </tr>
                  ) : (
                    tiposFiltrados.map((t) => (
                      <tr key={t.idTipo}>
                        <td>
                          <span className="badge bg-secondary-subtle text-dark">
                            #{t.idTipo}
                          </span>
                        </td>
                        <td className="fw-semibold">{t.tipo}</td>
                        <td>{t.descripcion || "—"}</td>
                        <td>
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => handleEditar(t)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleEliminar(t.idTipo)}
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-dark">
              Mostrando {tiposFiltrados.length} de {tipos.length}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
