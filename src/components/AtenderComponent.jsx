// src/components/AtenderComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listarVentas,
  descargarTicketVenta,
  listarDetalleVentaPorVenta,
  actualizarVenta,
  listarProductos, // ✅ NUEVO: para cargar todos los productos
} from "../services/api";

const AtenderComponent = () => {
  const { user } = useAuth();
  const roles = user?.roles || [];

  // ====== Helpers de rol ======
  const hasRole = (role) => {
    const withPrefix = role.startsWith("ROLE_") ? role : `ROLE_${role}`;
    const simple = withPrefix.replace("ROLE_", "");
    return roles.includes(withPrefix) || roles.includes(simple);
  };

  const isMesero = hasRole("MESERO");
  const isAdmin = hasRole("ADMIN");
  const isCajero = hasRole("CAJERO");

  const canUse = isMesero || isAdmin || isCajero;

  // 👉 Nombre del mesero logueado (para filtrar por lo que se ve en la BD)
  const meseroNombreClaveRaw =
    user?.empleado?.nombre ?? // "Roberto", "mesero1", etc
    user?.nombre ??
    user?.username ??
    "";

  const meseroNombreClaveFull = meseroNombreClaveRaw.trim().toLowerCase();
  // ej. "roberto.mesero" -> "roberto"
  const meseroNombreClaveSimple = meseroNombreClaveFull.split(".")[0];

  console.log("👤 AtenderComponent:", {
    meseroNombreClaveRaw,
    meseroNombreClaveFull,
    meseroNombreClaveSimple,
    user,
  });

  // ====== Estado ======
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ NUEVO: catálogo de productos
  const [productos, setProductos] = useState([]);

  // ====== Estado para MODAL de edición ======
  const [showModal, setShowModal] = useState(false);
  const [ventaEditando, setVentaEditando] = useState(null);
  const [detalleEdit, setDetalleEdit] = useState([]); // [{id_detalle,id_producto,nombre,precio_unitario,cantidad}]
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!canUse) return;
    cargarVentas();
    cargarProductos(); // ✅ NUEVO
  }, [canUse]);

  const cargarVentas = async () => {
    setLoading(true);
    try {
      const vs = await listarVentas();
      console.log("Ventas cargadas:", vs);
      setVentas(vs ?? []);
    } catch (err) {
      console.error("Error cargando ventas:", err);
      alert("❌ No se pudieron cargar las ventas");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: cargar todos los productos para el modal
  const cargarProductos = async () => {
    try {
      const ps = await listarProductos();
      const normalizados = (ps ?? []).map((p) => ({
        id_producto: p.id_producto ?? p.idProducto ?? p.id ?? null,
        nombre: p.nombre ?? p.nombreProducto ?? "Producto",
        precio_unitario: Number(p.precio_unitario ?? p.precioUnitario ?? p.precio ?? 0),
      })).filter((p) => p.id_producto != null);

      setProductos(normalizados);
    } catch (err) {
      console.error("Error cargando productos:", err);
      // no alert para no ser invasivo
    }
  };

  // ====== Helpers para info de mesero / fecha ======

  const getMeseroNombreFromVenta = (v) => {
    return v.empleado?.nombre || // ventas nuevas
      v.mesero?.nombre ||
      v.nombreMesero ||
      "";
  };

  const formatFecha = (v) => {
    const f =
      v.fechaventa ??
      v.fecha_venta ??
      v.fechaVenta ??
      v.fecha ??
      "";
    const s = String(f);
    if (!s) return "";
    return s.replace("T", " ").slice(0, 16); // 2025-12-08 16:46
  };

  // 1) Si es MESERO, filtramos SOLO las ventas que él atendió (por nombre)
  // 2) Luego aplicamos la búsqueda por ID / cliente
  const ventasFiltradas = useMemo(() => {
    let base = ventas;

    if (isMesero && meseroNombreClaveFull) {
      base = ventas.filter((v) => {
        const nombreVentaRaw = getMeseroNombreFromVenta(v);
        const nombreVenta = (nombreVentaRaw || "").trim().toLowerCase();

        if (!nombreVenta) return false;

        return (
          nombreVenta === meseroNombreClaveFull ||
          nombreVenta === meseroNombreClaveSimple
        );
      });
    }

    const q = searchTerm.trim().toLowerCase();
    if (!q) return base;

    return base.filter((v) => {
      const id = String(v.id_venta ?? v.idVenta ?? v.id ?? "");
      const clienteNombre =
        v.cliente?.nombre_cliente ||
        v.cliente?.nombreCliente ||
        v.clienteNombre ||
        "";
      return (
        id.toLowerCase().includes(q) ||
        clienteNombre.toLowerCase().includes(q)
      );
    });
  }, [
    ventas,
    searchTerm,
    isMesero,
    meseroNombreClaveFull,
    meseroNombreClaveSimple,
  ]);

  console.log("Ventas filtradas para mostrar:", ventasFiltradas);

  const handleVerTicket = async (idVenta) => {
    try {
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
    }
  };

  // =============== MODIFICAR VENTA (MODAL) ===============

  const abrirModalModificar = async (venta) => {
    try {
      const idVenta = venta.id_venta ?? venta.idVenta ?? venta.id;
      const detallesRaw = await listarDetalleVentaPorVenta(idVenta);

      const normalizados = (detallesRaw ?? []).map((d) => ({
        id_detalle: d.id_detalle ?? d.idDetalle ?? d.id ?? null,
        id_producto:
          d.id_producto ??
          d.producto?.id_producto ??
          d.producto?.id ??
          null,
        nombre:
          d.producto?.nombre ??
          d.nombreProducto ??
          d.nombre ??
          "Producto",
        precio_unitario: Number(
          d.precio_unitario ?? d.precioUnitario ?? d.precio ?? 0
        ),
        cantidad: Number(d.cantidad ?? 0),
      }));

      // ✅ NUEVO: asegurarnos de tener productos (si aún no cargaron)
      if (!productos || productos.length === 0) {
        await cargarProductos();
      }

      setVentaEditando(venta);
      setDetalleEdit(normalizados);
      setShowModal(true);
    } catch (err) {
      console.error("Error cargando detalle de venta:", err);
      alert("❌ No se pudo cargar el detalle de la venta.");
    }
  };

  const cerrarModalModificar = () => {
    setShowModal(false);
    setVentaEditando(null);
    setDetalleEdit([]);
  };

  const incrementarDetalle = (id_detalle) => {
    setDetalleEdit((prev) =>
      prev.map((d) =>
        d.id_detalle === id_detalle ? { ...d, cantidad: d.cantidad + 1 } : d
      )
    );
  };

  const decrementarDetalle = (id_detalle) => {
    setDetalleEdit((prev) =>
      prev
        .map((d) =>
          d.id_detalle === id_detalle ? { ...d, cantidad: d.cantidad - 1 } : d
        )
        .filter((d) => d.cantidad > 0)
    );
  };

  // ✅ NUEVO: agregar producto que NO estaba en la venta
  const agregarProductoANuevaVenta = (p) => {
    setDetalleEdit((prev) => {
      const ya = prev.find((d) => Number(d.id_producto) === Number(p.id_producto));
      if (ya) {
        // si ya existe, solo incrementa
        return prev.map((d) =>
          Number(d.id_producto) === Number(p.id_producto)
            ? { ...d, cantidad: d.cantidad + 1 }
            : d
        );
      }
      // si no existe, lo agrega con cantidad 1 (id_detalle null para que el backend lo cree)
      return [
        ...prev,
        {
          id_detalle: null,
          id_producto: p.id_producto,
          nombre: p.nombre,
          precio_unitario: Number(p.precio_unitario ?? 0),
          cantidad: 1,
        },
      ];
    });
  };

  const totalEditado = useMemo(
    () =>
      detalleEdit.reduce((acc, d) => acc + d.cantidad * d.precio_unitario, 0),
    [detalleEdit]
  );

  const guardarCambiosVenta = async () => {
    if (!ventaEditando) return;
    if (detalleEdit.length === 0) {
      alert("La venta no puede quedar vacía.");
      return;
    }

    const idVenta =
      ventaEditando.id_venta ?? ventaEditando.idVenta ?? ventaEditando.id;

    const idCliente =
      ventaEditando.id_cliente ??
      ventaEditando.cliente?.id_cliente ??
      ventaEditando.cliente?.id ??
      null;

    const idEmpleado =
      ventaEditando.id_empleado ??
      ventaEditando.empleado?.id_empleado ??
      ventaEditando.empleado?.id ??
      null;

    const idReserva =
      ventaEditando.id_reserva ??
      ventaEditando.reserva?.id_reserva ??
      ventaEditando.reserva?.id ??
      null;

    const payload = {
      id_cliente: idCliente,
      id_empleado: idEmpleado,
      id_reserva: idReserva,
      total: totalEditado,
      detalles: detalleEdit.map((d) => ({
        id_detalle: d.id_detalle,
        id_producto: d.id_producto,
        producto: { id_producto: d.id_producto },
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
      })),
    };

    try {
      setSavingEdit(true);
      await actualizarVenta(idVenta, payload);
      alert("✅ Venta actualizada correctamente");
      cerrarModalModificar();
      await cargarVentas();
    } catch (err) {
      console.error("Error actualizando venta:", err);
      alert("❌ No se pudo actualizar la venta.");
    } finally {
      setSavingEdit(false);
    }
  };

  // ✅ NUEVO: productos disponibles para agregar (los que no están ya en detalleEdit)
  const productosDisponiblesParaAgregar = useMemo(() => {
    const idsEnDetalle = new Set(
      (detalleEdit ?? []).map((d) => Number(d.id_producto))
    );
    return (productos ?? []).filter(
      (p) => !idsEnDetalle.has(Number(p.id_producto))
    );
  }, [productos, detalleEdit]);

  // ====================== RENDER ======================
  if (!canUse) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          No tienes permisos para acceder a esta pantalla.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 text-light">
      <h1 className="h4 mb-3 text-center">Historial de ventas</h1>

      {/* Búsqueda */}
      <div className="d-flex gap-2 mb-3">
        <input
          type="text"
          className="form-control bg-dark text-white"
          placeholder="Buscar por ID de venta o cliente…"
          style={{ maxWidth: 360 }}
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

      {/* Tabla */}
      {loading ? (
        <div className="card p-4 bg-dark text-light">
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border" role="status" />
            <span>Cargando ventas…</span>
          </div>
        </div>
      ) : ventasFiltradas.length === 0 ? (
        <div className="card p-4 text-center text-body-secondary bg-dark border-0">
          {isMesero
            ? "No tienes ventas registradas aún."
            : "No hay ventas registradas."}
        </div>
      ) : (
        <div className="table-responsive card shadow-sm bg-dark">
          <table className="table mb-0 align-middle table-dark table-striped">
            <thead>
              <tr>
                <th>ID Venta</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Mesero</th>
                <th>Total</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.map((v) => {
                const idVenta = v.id_venta ?? v.idVenta ?? v.id;
                const fecha = formatFecha(v);
                const clienteNombre =
                  v.cliente?.nombre_cliente ||
                  v.cliente?.nombreCliente ||
                  v.clienteNombre ||
                  "Mostrador";
                const total = v.total ?? 0;
                const meseroNombre = getMeseroNombreFromVenta(v) || "—";

                return (
                  <tr key={idVenta}>
                    <td>#{idVenta}</td>
                    <td>{fecha}</td>
                    <td>{clienteNombre}</td>
                    <td>{meseroNombre}</td>
                    <td>${Number(total).toFixed(2)}</td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleVerTicket(idVenta)}
                        >
                          PDF
                        </button>
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => abrirModalModificar(v)}
                        >
                          Modificar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL EDITAR VENTA */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1050,
          }}
        >
          <div
            className="position-absolute top-50 start-50 translate-middle"
            style={{ maxWidth: "600px", width: "100%" }}
          >
            <div className="card bg-dark text-light">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="m-0">
                  Modificar venta #
                  {ventaEditando?.id_venta ??
                    ventaEditando?.idVenta ??
                    ventaEditando?.id}
                </h5>
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={cerrarModalModificar}
                  disabled={savingEdit}
                >
                  ✖
                </button>
              </div>

              <div className="card-body">
                {/* ✅ NUEVO: lista de productos para agregar */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>Agregar productos</strong>
                    <small className="text-muted">
                      {productosDisponiblesParaAgregar.length} disponibles
                    </small>
                  </div>

                  {productosDisponiblesParaAgregar.length === 0 ? (
                    <div className="text-muted small mt-1">
                      No hay más productos para agregar.
                    </div>
                  ) : (
                    <div className="table-responsive mt-2">
                      <table className="table table-dark table-sm align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th className="text-end">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosDisponiblesParaAgregar.map((p) => (
                            <tr key={p.id_producto}>
                              <td>{p.nombre}</td>
                              <td>${Number(p.precio_unitario).toFixed(2)}</td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => agregarProductoANuevaVenta(p)}
                                  disabled={savingEdit}
                                >
                                  + Agregar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <hr className="border-secondary" />

                {detalleEdit.length === 0 ? (
                  <p className="text-muted">
                    No hay detalle de productos para esta venta.
                  </p>
                ) : (
                  <table className="table table-dark table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th style={{ width: "150px" }}>Cantidad</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleEdit.map((d) => (
                        <tr key={`${d.id_detalle ?? "new"}-${d.id_producto}`}>
                          <td>{d.nombre}</td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-light"
                                onClick={() => decrementarDetalle(d.id_detalle)}
                                disabled={savingEdit}
                              >
                                −
                              </button>
                              <span>{d.cantidad}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-light"
                                onClick={() => incrementarDetalle(d.id_detalle)}
                                disabled={savingEdit}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td>${d.precio_unitario.toFixed(2)}</td>
                          <td>${(d.precio_unitario * d.cantidad).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="d-flex justify-content-between mt-2">
                  <strong>Total editado:</strong>
                  <strong>${totalEditado.toFixed(2)}</strong>
                </div>
              </div>

              <div className="card-footer d-flex justify-content-end gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={cerrarModalModificar}
                  disabled={savingEdit}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-success"
                  onClick={guardarCambiosVenta}
                  disabled={savingEdit || detalleEdit.length === 0}
                >
                  {savingEdit ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtenderComponent;
