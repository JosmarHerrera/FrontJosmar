// src/components/EmpleadoComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listarEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
  registrarUsuarioEmpleado,
  vincularEmpleadoUsuario,
} from "../services/api";

const PUESTOS = ["MESERO", "CAJERO", "COCINERO", "SUPERVISOR", "ADMIN"];

// Genera un username a partir del nombre y puesto
const generarUsername = (nombre, puesto) => {
  const base =
    (nombre || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ".") || "empleado";

  const p = (puesto || "").trim().toLowerCase();
  return p ? `${base}.${p}` : base;
};

// Ajusta el texto del puesto para el AuthService.registerUserForEmpleado
// (porque ahí tu switch usa "Mesero", "Cajero", "Supervisor", "Administrador")
const normalizarPuestoParaAuth = (puesto) => {
  const up = (puesto || "").toUpperCase();

  switch (up) {
    case "MESERO":
      return "Mesero";
    case "CAJERO":
      return "Cajero";
    case "SUPERVISOR":
      return "Supervisor";
    case "ADMIN":
      return "Administrador";
    case "COCINERO":
      // Si no quieres usuario de sistema para cocinero, podrías lanzar error
      return "Cocinero"; // o lanzar error en AuthService
    default:
      return puesto; // fallback
  }
};

export const EmpleadoComponent = () => {
  const [empleados, setEmpleados] = useState([]);
  const [modoEditar, setModoEditar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    id_empleado: null,
    nombre: "",
    puesto: "",
    estatus: 1,
  });

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    setLoading(true);
    try {
      const data = await listarEmpleados();
      setEmpleados(data ?? []);
    } catch (error) {
      console.error("Error cargando empleados:", error);
      alert("❌ No se pudieron cargar los empleados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const resetForm = () =>
    setForm({ id_empleado: null, nombre: "", puesto: "", estatus: 1 });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      nombre: form.nombre.trim(),
      puesto: form.puesto.trim(),
      estatus: Number(form.estatus) || 1,
    };

    if (!payload.nombre) {
      alert("Completa el nombre.");
      return;
    }
    if (!payload.puesto) {
      alert("Selecciona un puesto.");
      return;
    }

    setSaving(true);
    try {
      if (modoEditar) {
        // 🔵 SOLO actualizamos los datos del empleado
        await actualizarEmpleado(form.id_empleado, payload);
        alert("✅ Empleado actualizado");
      } else {
        // 🟢 CREACIÓN NUEVA: aquí hacemos la magia

        // 1) Crear usuario en microservicio RESTAURANTE
        const username = generarUsername(payload.nombre, payload.puesto);
        const puestoAuth = normalizarPuestoParaAuth(payload.puesto);

        const userRequest = {
          username,
          password: "12345678", // 🔐 contraseña fija (se encripta en backend)
          puesto: puestoAuth,
        };

        const nuevoUsuario = await registrarUsuarioEmpleado(userRequest);

        // Dependiendo de cómo venga el DTO, buscamos el ID
        const idUsuario =
          nuevoUsuario.id ||
          nuevoUsuario.id_usuario ||
          nuevoUsuario.idUsuario;

        if (!idUsuario) {
          throw new Error(
            "No se pudo obtener el idUsuario al registrar el empleado."
          );
        }

        // 2) Crear empleado en microservicio RESERVACIONES
        const nuevoEmpleado = await crearEmpleado(payload);

        const idEmpleado =
          nuevoEmpleado.id_empleado ||
          nuevoEmpleado.idEmpleado ||
          nuevoEmpleado.id;

        if (!idEmpleado) {
          throw new Error(
            "No se pudo obtener el idEmpleado al crear el empleado."
          );
        }

        // 3) Vincular empleado ↔ usuario (llenar empleado.id_usuario)
        await vincularEmpleadoUsuario(idEmpleado, idUsuario);

        alert(
          `✅ Empleado creado.\n\nUsuario de sistema: ${username}\nContraseña inicial: 12345678`
        );
      }

      resetForm();
      setModoEditar(false);
      await cargarEmpleados();
    } catch (error) {
      console.error("Error guardando empleado:", error);
      alert("❌ Ocurrió un error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (empleado) => {
    setForm({
      id_empleado: empleado.id_empleado,
      nombre: empleado.nombre || "",
      puesto: empleado.puesto || "",
      estatus: empleado.estatus ?? 1,
    });
    setModoEditar(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id_empleado) => {
    if (!window.confirm("¿Seguro que deseas eliminar este empleado?")) return;
    try {
      await eliminarEmpleado(id_empleado);
      await cargarEmpleados();
      alert("🗑️ Empleado eliminado");
    } catch (error) {
      console.error("Error eliminando empleado:", error);
      alert("❌ No se pudo eliminar: " + error.message);
    }
  };

  const empleadosFiltrados = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return empleados;
    return empleados.filter((e) =>
      `${e.nombre ?? ""} ${e.puesto ?? ""}`.toLowerCase().includes(q)
    );
  }, [empleados, searchTerm]);

  return (
    <div className="container py-4">
      {/* Header + búsqueda */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h1 className="h4 m-0">Gestión de Empleados</h1>
        <span className="badge bg-secondary-subtle text-secondary-emphasis ms-2">
          {empleadosFiltrados.length} / {empleados.length}
        </span>

        <div className="ms-auto d-flex gap-2">
        <input
  type="text"
  className="form-control text-dark bg-white"
  placeholder="Buscar por nombre o puesto…"
  style={{ minWidth: 260 }}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

          {searchTerm && (
            <button
              className="btn btn-outline-secondary"
              onClick={() => setSearchTerm("")}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Layout 2 columnas: form + tarjetas */}
      <div className="row g-3">
        {/* Form */}
        <div className="col-12 col-lg-4">
          <form onSubmit={handleSubmit} className="card p-3 shadow-sm">
            <div className="mb-2">
              <label className="form-label fw-semibold">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="form-control"
                placeholder="Ej. Ana Ruiz"
              />
            </div>

            <div className="mb-2">
              <label className="form-label fw-semibold">Puesto *</label>
              <select
                name="puesto"
                className="form-select"
                value={form.puesto}
                onChange={handleChange}
              >
                <option value="">-- Selecciona un puesto --</option>
                {PUESTOS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Estatus</label>
              <select
                name="estatus"
                className="form-select"
                value={form.estatus}
                onChange={handleChange}
              >
                <option value={1}>Activo</option>
                <option value={0}>Inactivo</option>
              </select>
            </div>

            <div className="d-flex gap-2">
              <button
                className={`btn ${
                  modoEditar ? "btn-primary" : "btn-success"
                }`}
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

        {/* Tarjetas de empleados */}
        <div className="col-12 col-lg-8">
          {loading ? (
            <div className="card p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="spinner-border text-light" role="status" />
                <span>Cargando empleados…</span>
              </div>
            </div>
          ) : empleadosFiltrados.length === 0 ? (
            <div className="card p-4 text-center text-body-secondary">
              No se encontraron empleados
            </div>
          ) : (
            <div className="row g-3">
              {empleadosFiltrados.map((e) => (
                <div className="col-12 col-sm-6 col-xl-4" key={e.id_empleado}>
                  <div className="card employee-card h-100 p-3 shadow-sm">
                    <div className="d-flex align-items-start justify-content-between">
                      <div>
                        <div className="small text-body-secondary">ID</div>
                        <div className="fw-semibold">#{e.id_empleado}</div>
                      </div>
                      <span className="badge bg-primary-subtle text-primary-emphasis">
                        {e.puesto || "—"}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-body-secondary small">Nombre</div>
                      <div className="fs-6 fw-semibold">
                        {e.nombre || "Sin nombre"}
                      </div>
                    </div>

                    <div className="mt-2 small">
                      <span
                        className={
                          e.estatus === 1
                            ? "badge bg-success-subtle text-success-emphasis"
                            : "badge bg-secondary-subtle text-secondary-emphasis"
                        }
                      >
                        {e.estatus === 1 ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="d-flex gap-2 mt-3 flex-wrap">
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => handleEditar(e)}
                        title="Editar"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleEliminar(e.id_empleado)}
                        title="Eliminar"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmpleadoComponent;
