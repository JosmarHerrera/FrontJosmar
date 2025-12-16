// src/components/ReservaComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarReservas,
  crearReserva,
  actualizarReserva,
  eliminarReserva,
  confirmarReserva,
  cancelarReserva,
  listarMesas,
  listarClientes,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export const ReservaComponent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roles = user?.roles || [];

  const esCliente =
    roles.includes("ROLE_CLIENTE") || roles.includes("CLIENTE");

  const nombreUsuarioLower = (
    user?.username ||
    user?.nombre ||
    ""
  ).toLowerCase();

  // Datos
  const [reservas, setReservas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [mesas, setMesas] = useState([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Filtros
  const [search, setSearch] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("HOY"); // "HOY" | "TODAS"

  // Formulario
  const [form, setForm] = useState({
    idReserva: null,
    fecha: "",
    hora: "",
    idCliente: "",
    idMesa: "",
  });
  const [modoEditar, setModoEditar] = useState(false);

  // Fecha actual (solo día)
  const hoyISO = new Date().toISOString().slice(0, 10);

  // ===============================
  // HELPERS DE FECHA/HORA
  // ===============================
  const esDiaPasado = (fechaISO) => {
    if (!fechaISO) return false;
    return fechaISO < hoyISO;
  };

  const esDiaFuturo = (fechaISO) => {
    if (!fechaISO) return false;
    return fechaISO > hoyISO;
  };

  // true cuando la (fecha + hora) de la reserva ya se alcanzó o pasó
  const fechaHoraSuperada = (fechaISO, horaStr) => {
    if (!fechaISO || !horaStr) return false;

    // soportar "HH:mm" o "HH:mm:ss"
    const partesHora = horaStr.split(":");
    const hh = Number(partesHora[0] || 0);
    const mm = Number(partesHora[1] || 0);

    const year = Number(fechaISO.slice(0, 4));
    const month = Number(fechaISO.slice(5, 7)) - 1; // 0-based
    const day = Number(fechaISO.slice(8, 10));

    const fechaReserva = new Date(year, month, day, hh, mm, 0);
    const ahora = new Date();

    return ahora.getTime() >= fechaReserva.getTime();
  };

  // ===============================
  // CARGA Y NORMALIZACIÓN
  // ===============================
  const loadAndEnrich = async () => {
    setLoading(true);
    try {
      const [resvRaw, clsRaw, msRaw] = await Promise.all([
        listarReservas(),
        listarClientes(),
        listarMesas(),
      ]);

      // Normalizar clientes
      const normalizadosClientes = (clsRaw ?? [])
        .map((c) => ({
          id_cliente: c.id_cliente ?? c.idCliente ?? c.id ?? null,
          nombrecliente:
            c.nombrecliente ??
            c.nombreCliente ??
            c.nombre_cliente ??
            "",
        }))
        .filter((c) => c.id_cliente != null);

      // Normalizar mesas
      const normalizadasMesas = (msRaw ?? []).map((m) => ({
        id_mesa: m.id_mesa ?? m.idMesa ?? m.id,
        numero: m.numero,
        ubicacion: m.ubicacion,
      }));

      // Unir datos en reservas
      let enriched = (resvRaw ?? []).map((r) => {
        const cliente = normalizadosClientes.find(
          (c) => Number(c.id_cliente) === Number(r.id_cliente)
        );
        const mesa = normalizadasMesas.find(
          (m) =>
            Number(m.id_mesa) ===
            Number(r.mesa?.id_mesa ?? r.id_mesa)
        );

        return {
          idReserva: r.id_reserva ?? r.idReserva ?? r.id,
          fecha: r.fecha,
          hora: r.hora,
          id_cliente: r.id_cliente,
          mesa: mesa ?? r.mesa,
          nombre_cliente:
            r.nombre_cliente ?? cliente?.nombrecliente ?? "Desconocido",
          numero_mesa: r.numero_mesa ?? mesa?.numero ?? "—",
          ubicacion_mesa: mesa?.ubicacion ?? "No definida",
          estatus: r.estatus ?? "PENDIENTE",
        };
      });

      // 🔒 Si es CLIENTE, solo puede ver SUS reservas (por nombre de usuario)
      if (esCliente && nombreUsuarioLower) {
        enriched = enriched.filter(
          (r) =>
            (r.nombre_cliente || "").toLowerCase() ===
            nombreUsuarioLower
        );
      }

      setReservas(enriched);
      setClientes(normalizadosClientes);
      setMesas(normalizadasMesas);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Error al cargar información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAndEnrich();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setForm({
      idReserva: null,
      fecha: "",
      hora: "",
      idCliente: "",
      idMesa: "",
    });
    setModoEditar(false);
  };

  // ===============================
  // GUARDAR / EDITAR RESERVA
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.fecha?.trim() ||
      !form.hora?.trim() ||
      !form.idCliente?.trim() ||
      !form.idMesa?.trim()
    ) {
      return alert("Completa todos los campos obligatorios.");
    }

    // 🚫 No permitir mover/crear reservas a fechas pasadas
    if (form.fecha < hoyISO) {
      alert("No puedes registrar o mover una reserva a una fecha pasada.");
      return;
    }

    const payload = {
      id_cliente: Number(form.idCliente),
      mesa: { id_mesa: Number(form.idMesa) },
      fecha: form.fecha,
      hora: form.hora,
    };

    setSaving(true);
    try {
      if (modoEditar) {
        await actualizarReserva(form.idReserva, payload);
        alert("✅ Reserva actualizada");
      } else {
        await crearReserva(payload);
        alert("✅ Reserva creada");
      }

      resetForm();
      await loadAndEnrich();
    } catch (e) {
      console.error("Error guardando reserva:", e);
      alert("❌ Error al guardar la reserva.");
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // ACCIONES INDIVIDUALES
  // ===============================
  const handleEditar = (r) => {
    setForm({
      idReserva: r.idReserva,
      fecha: r.fecha,
      hora: r.hora,
      idCliente: String(r.id_cliente),
      idMesa: String(r.mesa?.id_mesa ?? r.id_mesa),
    });
    setModoEditar(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar reserva?")) return;
    try {
      await eliminarReserva(id);
      await loadAndEnrich();
      alert("🗑️ Reserva eliminada");
    } catch (e) {
      console.error(e);
      alert("❌ No se pudo eliminar");
    }
  };

  const handleConfirmar = async (id) => {
    try {
      await confirmarReserva(id);
      await loadAndEnrich();
      alert("✅ Reserva confirmada");
    } catch (e) {
      console.error(e);
      alert("❌ No se pudo confirmar");
    }
  };

  const handleCancelarReserva = async (id) => {
    if (!window.confirm("¿Cancelar reserva?")) return;
    try {
      await cancelarReserva(id);
      await loadAndEnrich();
      alert("🚫 Reserva cancelada");
    } catch (e) {
      console.error(e);
      alert("❌ No se pudo cancelar");
    }
  };

  // ===============================
  // FILTROS
  // ===============================
  const reservasFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = reservas ?? [];

    // Filtro de fecha: Hoy / Todas
    if (filtroFecha === "HOY") {
      base = base.filter((r) => r.fecha === hoyISO);
    }

    return base.filter(
      (r) =>
        !q ||
        r.nombre_cliente.toLowerCase().includes(q) ||
        String(r.numero_mesa).includes(q)
    );
  }, [reservas, search, filtroFecha, hoyISO]);

  // ===============================
  // RENDER
  // ===============================
  if (loading) {
    return (
      <div className="container py-4">
        <div className="card p-4">
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border text-light"></div>
            <span>Cargando…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h3 className="m-0">Gestión de Reservas</h3>
        <span className="badge bg-secondary-subtle text-secondary-emphasis ms-2">
          {reservasFiltradas.length} / {reservas.length}
        </span>

        <div className="ms-auto d-flex gap-2 flex-wrap">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ${
                filtroFecha === "HOY"
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => setFiltroFecha("HOY")}
            >
              Hoy
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                filtroFecha === "TODAS"
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => setFiltroFecha("TODAS")}
            >
              Todas
            </button>
          </div>

          <input
            type="text"
            className="form-control text-dark bg-white"
            placeholder="Buscar por cliente o mesa…"
            style={{ minWidth: 240 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        {/* Formulario (oculto para CLIENTE) */}
        {!esCliente && (
          <div className="col-12 col-lg-4">
            <form onSubmit={handleSubmit} className="card p-3 shadow-sm">
              <label className="form-label fw-semibold">Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                required
                min={hoyISO}
                className="form-control text-dark bg-white mb-2"
              />

              <label className="form-label fw-semibold">Hora *</label>
              <input
                type="time"
                name="hora"
                value={form.hora}
                onChange={handleChange}
                required
                className="form-control text-dark bg-white mb-2"
              />

              <label className="form-label fw-semibold">Cliente *</label>
              <select
                name="idCliente"
                value={form.idCliente}
                onChange={handleChange}
                required
                className="form-select text-white bg-dark option-white mb-2"
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombrecliente}
                  </option>
                ))}
              </select>

              <label className="form-label fw-semibold">Mesa *</label>
              <select
                name="idMesa"
                value={form.idMesa}
                onChange={handleChange}
                required
                className="form-select text-white bg-dark option-white mb-3"
              >
                <option value="">Selecciona una mesa</option>
                {mesas.map((m) => (
                  <option key={m.id_mesa} value={m.id_mesa}>
                    {m.ubicacion} - Mesa #{m.numero}
                  </option>
                ))}
              </select>

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
                    onClick={resetForm}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Tabla */}
        <div className={esCliente ? "col-12" : "col-12 col-lg-8"}>
          <div className="card p-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Mesa</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estatus</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        No hay reservas
                      </td>
                    </tr>
                  ) : (
                    reservasFiltradas.map((r) => {
                      const estatusUpper = (r.estatus || "").toUpperCase();
                      const confirmada = estatusUpper === "CONFIRMADA";
                      const cancelada = estatusUpper === "CANCELADA";
                      const pendiente = estatusUpper === "PENDIENTE";

                      const diaPasado = esDiaPasado(r.fecha);
                      const diaFuturo = esDiaFuturo(r.fecha);
                      const esHoy = r.fecha === hoyISO;

                      // 👇 Para CLIENTE: solo botón Confirmar cuando ya es la hora
                      const puedeConfirmarCliente =
                        esCliente &&
                        pendiente &&
                        fechaHoraSuperada(r.fecha, r.hora);

                      // ==== ACCIONES PARA TRABAJADOR (no cliente) ====
                      let accionesTrabajador = (
                        <div className="text-end text-muted">—</div>
                      );

                      if (!esCliente) {
                        if (esHoy) {
                          // HOY
                          accionesTrabajador = (
                            <div className="d-flex justify-content-end gap-2 flex-wrap">
                              {/* Editar: solo si no está cancelada */}
                              {!cancelada && (
                                <button
                                  className="btn btn-sm btn-light"
                                  onClick={() => handleEditar(r)}
                                >
                                  ✏️
                                </button>
                              )}

                              {/* Confirmar: solo PENDIENTE */}
                              {pendiente && (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() =>
                                    handleConfirmar(r.idReserva)
                                  }
                                >
                                  ✔️
                                </button>
                              )}

                              {/* Cobrar: solo CONFIRMADA */}
                              {confirmada && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() =>
                                    navigate(
                                      `/ventas?idReserva=${
                                        r.idReserva
                                      }&idCliente=${
                                        r.id_cliente
                                      }&nombreCliente=${encodeURIComponent(
                                        r.nombre_cliente
                                      )}`
                                    )
                                  }
                                >
                                  💳
                                </button>
                              )}

                              {/* Cancelar: SOLO PENDIENTE */}
                              {pendiente && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    handleCancelarReserva(r.idReserva)
                                  }
                                >
                                  Cancelar
                                </button>
                              )}

                              {/* Eliminar: solo CANCELADA */}
                              {cancelada && (
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() =>
                                    handleEliminar(r.idReserva)
                                  }
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          );
                        } else {
                          // NO ES HOY (ayer / mañana / otro día)
                          if (cancelada) {
                            // Solo eliminar
                            accionesTrabajador = (
                              <div className="d-flex justify-content-end">
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() =>
                                    handleEliminar(r.idReserva)
                                  }
                                >
                                  Eliminar
                                </button>
                              </div>
                            );
                          } else if (pendiente) {
                            // Pendiente en otro día: se puede cancelar, pero no confirmar
                            accionesTrabajador = (
                              <div className="d-flex justify-content-end">
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    handleCancelarReserva(r.idReserva)
                                  }
                                >
                                  Cancelar
                                </button>
                              </div>
                            );
                          } else {
                            // Confirmada en otro día: sin acciones
                            accionesTrabajador = (
                              <div className="text-end text-muted">—</div>
                            );
                          }
                        }
                      }

                      return (
                        <tr key={r.idReserva}>
                          <td>#{r.idReserva}</td>
                          <td>{r.nombre_cliente}</td>
                          <td>
                            {r.ubicacion_mesa} - #{r.numero_mesa}
                          </td>
                          <td>{r.fecha}</td>
                          <td>{r.hora}</td>
                          <td>
                            {cancelada ? (
                              <span className="badge bg-danger">
                                Cancelada
                              </span>
                            ) : confirmada ? (
                              <span className="badge bg-success">
                                Confirmada
                              </span>
                            ) : (
                              <span className="badge bg-warning text-dark">
                                Pendiente
                              </span>
                            )}
                          </td>

                          <td>
                            {/* Acciones para ADMIN / CAJERO / etc. */}
                            {!esCliente && accionesTrabajador}

                            {/* Acción especial solo para CLIENTE */}
                            {esCliente && (
                              <div className="d-flex justify-content-end">
                                {puedeConfirmarCliente ? (
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() =>
                                      handleConfirmar(r.idReserva)
                                    }
                                  >
                                    Confirmar
                                  </button>
                                ) : (
                                  <span className="text-muted small">—</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <small>
              Mostrando {reservasFiltradas.length} de {reservas.length}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservaComponent;
