// src/components/ListClienteComponent.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  listarClientes,
  crearCliente,
  actualizarCliente,
  desactivarCliente,
  registrarUsuarioCliente,
  listarVentas,
  descargarTicketVenta,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export function ListClienteComponent() {
  const { user } = useAuth();
  const rawRoles = user?.roles || [];

  // ===== ROLES =====
  const hasRole = (role) => {
    const withPrefix = role.startsWith("ROLE_") ? role : `ROLE_${role}`;
    const simple = withPrefix.replace("ROLE_", "");
    return rawRoles.includes(withPrefix) || rawRoles.includes(simple);
  };

  const isAdmin = hasRole("ADMIN");
  const isSupervisor = hasRole("SUPERVISOR");
  const isCajero = hasRole("CAJERO");
  const isClienteRole = hasRole("CLIENTE");

  const canManageClientes = isAdmin || isSupervisor || isCajero;

  // id/nombre del cliente actual (calculados por username)
  const [currentClientId, setCurrentClientId] = useState(null);
  const [currentClientName, setCurrentClientName] = useState("");

  // ===== STATE CLIENTES =====
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    id: null,
    nombreCliente: "",
    telefonoCliente: "",
    correoCliente: "",
  });
  const [modoEditar, setModoEditar] = useState(false);

  // búsqueda con debounce
  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(searchTerm), 250);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  // ===== STATE VENTAS (MIS COMPRAS) =====
  const [ventas, setVentas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [ticketLoadingId, setTicketLoadingId] = useState(null);

  // ================== CARGA INICIAL ==================
  useEffect(() => {
    (async () => {
      try {
        const data = await listarClientes();

        const normalizados = (Array.isArray(data) ? data : []).map((c) => ({
          id: c.id ?? c.id_cliente ?? c.idCliente ?? c.idcliente ?? null,
          nombreCliente:
            c.nombreCliente ?? c.nombre_cliente ?? c.nombrecliente ?? "",
          telefonoCliente:
            c.telefonoCliente ??
            c.telefono_cliente ??
            c.telefonocliente ??
            "",
          correoCliente:
            c.correoCliente ?? c.correo_cliente ?? c.correocliente ?? "",
        }));

        let visibles = normalizados;

        if (isClienteRole) {
          const username =
            (user?.username || user?.nombre || "").toLowerCase();

          // buscamos el cliente cuyo nombre (o correo) coincide con el username
          const myself = normalizados.find((c) => {
            const n = (c.nombreCliente || "").toLowerCase();
            const mail = (c.correoCliente || "").toLowerCase();
            return n === username || mail === username;
          });

          if (myself) {
            visibles = [myself];
            setCurrentClientId(myself.id);
            setCurrentClientName(myself.nombreCliente || username);
          } else if (normalizados.length === 1) {
            // caso extremo: sólo hay 1 cliente en la BD
            visibles = [normalizados[0]];
            setCurrentClientId(normalizados[0].id);
            setCurrentClientName(normalizados[0].nombreCliente);
          } else {
            console.warn(
              "CLIENTE logueado pero no se encontró su fila en clientes. username=",
              user?.username,
              " lista:",
              normalizados
            );
          }
        }

        setClientes(visibles);

        // ---- Cargar "mis compras" si tenemos cliente actual ----
        if (isClienteRole && (currentClientId || visibles.length === 1)) {
          const idParaVentas =
            currentClientId || (visibles[0] && visibles[0].id);
          const nombreParaVentas =
            currentClientName || (visibles[0] && visibles[0].nombreCliente);

          if (idParaVentas || nombreParaVentas) {
            setLoadingVentas(true);
            const vs = await listarVentas().catch(() => []);

            const mias = (vs ?? []).filter((v) => {
              const cli = v.cliente || {};
              const cliId =
                cli.id_cliente ??
                cli.idCliente ??
                v.id_cliente ??
                v.idCliente ??
                null;
              const cliNombre =
                cli.nombre_cliente ??
                cli.nombreCliente ??
                v.clienteNombre ??
                "";

              const porId =
                idParaVentas &&
                cliId != null &&
                Number(cliId) === Number(idParaVentas);

              const porNombre =
                nombreParaVentas &&
                cliNombre &&
                cliNombre.toLowerCase() ===
                  nombreParaVentas.toLowerCase();

              return porId || porNombre;
            });

            setVentas(mias);
          }
        }
      } catch (err) {
        console.error("Error cargando clientes / ventas:", err);
        setError(err?.message || "Error cargando información");
      } finally {
        setLoading(false);
        setLoadingVentas(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClienteRole, user?.username]);

  // ================== HELPERS ==================
  const resetForm = () =>
    setForm({
      id: null,
      nombreCliente: "",
      telefonoCliente: "",
      correoCliente: "",
    });

  const validar = () => {
    if (!form.nombreCliente.trim()) return "El nombre es requerido";
    if (!form.telefonoCliente.trim()) return "El teléfono es requerido";
    if (!form.correoCliente.trim()) return "El correo es requerido";
    return "";
  };

  // ================== GUARDAR / EDITAR ==================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManageClientes) {
      setError("No tienes permisos para modificar clientes.");
      return;
    }

    const msg = validar();
    if (msg) {
      setError(msg);
      return;
    }

    const nombre = form.nombreCliente.trim();
    const tel = form.telefonoCliente.trim();
    const mail = form.correoCliente.trim();

    const payload = {
      id_cliente: form.id,
      nombreCliente: nombre,
      telefonoCliente: tel,
      correoCliente: mail,
      nombre_cliente: nombre,
      telefono_cliente: tel,
      correo_cliente: mail,
    };

    setSaving(true);
    try {
      if (modoEditar && form.id != null) {
        await actualizarCliente(form.id, payload);
      } else {
        const creado = await crearCliente(payload);
        const newId =
          creado.id ??
          creado.id_cliente ??
          creado.idCliente ??
          creado.idcliente;

        if (!newId) {
          throw new Error("No se pudo obtener el ID del cliente creado.");
        }

        await registrarUsuarioCliente(newId, {
          username: nombre,
          password: "12345678",
        });
      }

      // recargar lista de clientes (pero respetando filtro)
      const data = await listarClientes();
      const normalizados = (Array.isArray(data) ? data : []).map((c) => ({
        id: c.id ?? c.id_cliente ?? c.idCliente ?? c.idcliente ?? null,
        nombreCliente:
          c.nombreCliente ?? c.nombre_cliente ?? c.nombrecliente ?? "",
        telefonoCliente:
          c.telefonoCliente ??
          c.telefono_cliente ??
          c.telefonocliente ??
          "",
        correoCliente:
          c.correoCliente ?? c.correo_cliente ?? c.correocliente ?? "",
      }));

      let visibles = normalizados;
      if (isClienteRole && currentClientId) {
        visibles = normalizados.filter(
          (c) => Number(c.id) === Number(currentClientId)
        );
      }

      setClientes(visibles);

      resetForm();
      setModoEditar(false);
      setError("");
    } catch (err) {
      console.error("Error guardando cliente / usuario:", err);
      setError(err?.message || "Error guardando cliente / usuario");
    } finally {
      setSaving(false);
    }
  };

  // ================== ACCIONES CLIENTE ==================
  const handleEditar = (c) => {
    if (!canManageClientes) return;

    setForm({
      id: c.id,
      nombreCliente: c.nombreCliente ?? "",
      telefonoCliente: c.telefonoCliente ?? "",
      correoCliente: c.correoCliente ?? "",
    });
    setModoEditar(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelar = () => {
    resetForm();
    setModoEditar(false);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!canManageClientes) {
      setError("No tienes permisos para modificar clientes.");
      return;
    }
    if (!window.confirm("¿Desactivar este cliente?")) return;

    try {
      await desactivarCliente(id);
      const data = await listarClientes();
      const normalizados = (Array.isArray(data) ? data : []).map((c) => ({
        id: c.id ?? c.id_cliente ?? c.idCliente ?? c.idcliente ?? null,
        nombreCliente:
          c.nombreCliente ?? c.nombre_cliente ?? c.nombrecliente ?? "",
        telefonoCliente:
          c.telefonoCliente ??
          c.telefono_cliente ??
          c.telefonocliente ??
          "",
        correoCliente:
          c.correoCliente ?? c.correo_cliente ?? c.correocliente ?? "",
      }));

      let visibles = normalizados;
      if (isClienteRole && currentClientId) {
        visibles = normalizados.filter(
          (c) => Number(c.id) === Number(currentClientId)
        );
      }
      setClientes(visibles);
    } catch (err) {
      console.error("Error desactivando cliente:", err);
      setError(err?.message || "Error al desactivar");
    }
  };

  // ================== FILTRO LISTA CLIENTES ==================
  const clientesFiltrados = useMemo(() => {
    if (!debounced.trim()) return clientes;
    const q = debounced.toLowerCase();
    return clientes.filter((c) =>
      `${c.nombreCliente} ${c.correoCliente} ${c.telefonoCliente}`
        .toLowerCase()
        .includes(q)
    );
  }, [clientes, debounced]);

  const total = clientes.length;

  const formColClass = canManageClientes ? "col-12 col-lg-4" : "d-none";
  const tableColClass = canManageClientes ? "col-12 col-lg-8" : "col-12";

  // ================== MIS COMPRAS ==================
  const handleVerTicket = async (venta) => {
    const idVenta = venta.id_venta ?? venta.idVenta ?? venta.id;
    try {
      setTicketLoadingId(idVenta);
      const blob = await descargarTicketVenta(idVenta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket_venta_${idVenta}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar ticket:", err);
      alert("❌ No se pudo descargar el ticket");
    } finally {
      setTicketLoadingId(null);
    }
  };

  // ================== RENDER ==================
  if (loading) {
    return (
      <div className="container py-4">
        <div className="card p-4">
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border text-light" role="status" />
            <span>Cargando clientes…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header + búsqueda */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h1 className="h4 m-0">
          {isClienteRole ? "Mi perfil de cliente" : "Gestión de Clientes"}
        </h1>
        <span className="badge bg-secondary-subtle text-secondary-emphasis ms-2">
          {clientesFiltrados.length} / {total}
        </span>

        {total > 1 && (
          <div className="ms-auto d-flex gap-2">
            <input
              type="text"
              className="form-control text-dark bg-white"
              placeholder="Buscar por nombre, correo o teléfono…"
              style={{ minWidth: 260 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {debounced && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <span className="me-2">⚠️</span> {error}
        </div>
      )}

      <div className="row g-3">
        {/* Formulario: solo staff */}
        <div className={formColClass}>
          {canManageClientes && (
            <form onSubmit={handleSubmit} className="card p-3 shadow-sm">
              <h5 className="fw-semibold mb-3">
                {modoEditar ? "Editar cliente" : "Agregar cliente"}
              </h5>

              <div className="mb-2">
                <label className="form-label fw-semibold">Nombre *</label>
                <input
                  type="text"
                  name="nombreCliente"
                  className="form-control"
                  value={form.nombreCliente}
                  onChange={(e) =>
                    setForm({ ...form, nombreCliente: e.target.value })
                  }
                  placeholder="Ej. Josmar Herrera"
                />
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold">Teléfono *</label>
                <input
                  type="tel"
                  name="telefonoCliente"
                  className="form-control"
                  value={form.telefonoCliente}
                  onChange={(e) =>
                    setForm({ ...form, telefonoCliente: e.target.value })
                  }
                  placeholder="Ej. 5512345678"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Correo *</label>
                <input
                  type="email"
                  name="correoCliente"
                  className="form-control"
                  value={form.correoCliente}
                  onChange={(e) =>
                    setForm({ ...form, correoCliente: e.target.value })
                  }
                  placeholder="Ej. usuario@correo.com"
                />
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-primary" disabled={saving}>
                  {saving
                    ? "Guardando…"
                    : modoEditar
                    ? "Actualizar"
                    : "Guardar"}
                </button>
                {modoEditar && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCancelar}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Tabla clientes */}
        <div className={tableColClass}>
          <div className="card p-0 shadow-sm">
            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: 72 }}>ID</th>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    {canManageClientes && (
                      <th style={{ width: 170 }} className="text-end">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canManageClientes ? 5 : 4}
                        className="text-center py-4 text-body-secondary"
                      >
                        No se encontraron clientes
                      </td>
                    </tr>
                  ) : (
                    clientesFiltrados.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary-emphasis">
                            #{c.id}
                          </span>
                        </td>
                        <td className="fw-semibold">
                          {c.nombreCliente || "Sin nombre"}
                        </td>
                        <td>{c.telefonoCliente || "—"}</td>
                        <td>
                          {c.correoCliente ? (
                            <a
                              href={`mailto:${c.correoCliente}`}
                              className="link-body-emphasis"
                            >
                              {c.correoCliente}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        {canManageClientes && (
                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-light"
                                title="Editar"
                                onClick={() => handleEditar(c)}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(c.id)}
                                title="Desactivar"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-body-secondary">
              Mostrando {clientesFiltrados.length} de {clientes.length}
            </small>
          </div>
        </div>
      </div>

      {/* MIS COMPRAS - sólo cliente */}
      {isClienteRole && (
        <div className="card mt-4 p-3 shadow-sm">
          <h5 className="fw-semibold mb-3">Mis compras</h5>

          {loadingVentas ? (
            <div className="d-flex align-items-center gap-2">
              <div className="spinner-border" role="status" />
              <span>Cargando tus compras…</span>
            </div>
          ) : ventas.length === 0 ? (
            <p className="text-body-secondary mb-0">
              No tienes compras registradas.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-striped mb-0">
                <thead>
                  <tr>
                    <th>ID Venta</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((v) => {
                    const idVenta = v.id_venta ?? v.idVenta ?? v.id;
                    const fecha = v.fecha_venta || v.fechaVenta || "";
                    const total = v.total ?? 0;
                    return (
                      <tr key={idVenta}>
                        <td>#{idVenta}</td>
                        <td>{fecha}</td>
                        <td>${Number(total).toFixed(2)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleVerTicket(v)}
                            disabled={ticketLoadingId === idVenta}
                          >
                            {ticketLoadingId === idVenta ? "..." : "PDF"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ListClienteComponent;
