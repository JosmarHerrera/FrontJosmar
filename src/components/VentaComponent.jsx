// src/components/VentaComponent.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  listarClientes,
  listarProductos,
  listarVentas,
  crearVenta,
  listarReservas,
  descargarTicketVenta,
  listarMeserosActivos, // 👈 NUEVO
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const BASE_IMG_URL = "https://fondajosmar-production.up.railway.app/uploads/";

export const VentaComponent = () => {
  const { search } = useLocation();
  const qp = new URLSearchParams(search);
  const idReservaURL = qp.get("idReserva");
  const idClienteURL = qp.get("idCliente");

  const { user } = useAuth();

  // Empleado logueado (cajero)
  const cajeroId =
    user?.idUsuario ??
    user?.empleado?.id_empleado ??
    user?.empleado?.idEmpleado ??
    user?.empleadoId ??
    user?.idEmpleado ??
    null;

  const cajeroNombre =
    user?.empleado?.nombre ??
    user?.nombre ??
    user?.username ??
    "";

  const cajeroPuesto =
    user?.empleado?.puesto ??
    user?.puesto ??
    "";

  const [clientes, setClientes] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [meseros, setMeseros] = useState([]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [reservaSeleccionada, setReservaSeleccionada] = useState("");
  const [meseroSeleccionado, setMeseroSeleccionado] = useState("");

  const [carrito, setCarrito] = useState([]);
  const [qty, setQty] = useState({});
  const [ticketUrl, setTicketUrl] = useState("");

  const money = (n) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(n || 0));

  const hoyStr = new Date().toISOString().slice(0, 10);

  const esHoy = (fechaStr) => {
    if (!fechaStr) return false;
    return fechaStr.slice(0, 10) === hoyStr;
  };

  const normalizarFechaReserva = (r) => {
    const f =
      r.fecha_reserva ??
      r.fechaReserva ??
      r.fecha ??
      r.fecha_reservacion ??
      r.fechareserva ??
      null;
    if (!f) return null;
    const s = String(f);
    return s.length >= 10 ? s.slice(0, 10) : s;
  };

  // === CARGA INICIAL ===
  useEffect(() => {
    const load = async () => {
      try {
        const [cRaw, p, r, v, mRaw] = await Promise.all([
          listarClientes().catch(() => []),
          listarProductos().catch(() => []),
          listarReservas().catch(() => []),
          listarVentas().catch(() => []),
          listarMeserosActivos().catch(() => []),
        ]);

        const normalizadosClientes = (cRaw ?? [])
          .map((c) => ({
            id_cliente: c.id_cliente ?? c.idCliente ?? c.id ?? null,
            nombrecliente:
              c.nombrecliente ??
              c.nombreCliente ??
              c.nombre_cliente ??
              c.nombre ??
              "",
          }))
          .filter((c) => c.id_cliente != null);

        const normalizadosMeseros = (mRaw ?? [])
          .map((e) => ({
            id_empleado: e.id_empleado ?? e.idEmpleado ?? e.id ?? null,
            nombre: e.nombre ?? "",
          }))
          .filter((e) => e.id_empleado != null);

        console.log("Clientes crudos:", cRaw);
        console.log("Clientes normalizados:", normalizadosClientes);
        console.log("Meseros normalizados:", normalizadosMeseros);

        setClientes(normalizadosClientes);
        setProductos(p || []);
        setReservas(r || []);
        setVentas(v || []);
        setMeseros(normalizadosMeseros);

        if (idClienteURL) setClienteSeleccionado(String(idClienteURL));
        if (idReservaURL) setReservaSeleccionada(String(idReservaURL));
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [idClienteURL, idReservaURL]);

  // === RESERVAS FILTRADAS POR CLIENTE ===
  const reservasCliente = useMemo(() => {
    if (!clienteSeleccionado) return [];
    const idC = Number(clienteSeleccionado);
    return (reservas || []).filter((r) => {
      const idCli =
        r.id_cliente ??
        r.idCliente ??
        r.cliente?.id_cliente ??
        r.cliente?.id ??
        null;
      return idCli === idC;
    });
  }, [reservas, clienteSeleccionado]);

  // === CARRITO ===
  const agregar = (p) => {
    const id = p.idProducto || p.id || p.id_producto;
    const cantidad = Math.max(1, Number(qty[id] || 1));
    const precio = Number(p.precio || 0);

    setCarrito((prev) => {
      const yaExiste = prev.find((x) => x.idProducto === id);
      if (yaExiste) {
        return prev.map((x) =>
          x.idProducto === id
            ? { ...x, cantidad: x.cantidad + cantidad }
            : x
        );
      }
      return [
        ...prev,
        {
          idProducto: id,
          nombre: p.nombre,
          precioUnitario: precio,
          cantidad,
        },
      ];
    });

    setQty((prev) => ({ ...prev, [id]: 1 }));
  };

  const eliminar = (id) =>
    setCarrito((prev) => prev.filter((x) => x.idProducto !== id));

  const incrementarCantidad = (id) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.idProducto === id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  };

  const decrementarCantidad = (id) => {
    setCarrito((prev) =>
      prev
        .map((item) =>
          item.idProducto === id
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const total = useMemo(
    () => carrito.reduce((acc, x) => acc + x.cantidad * x.precioUnitario, 0),
    [carrito]
  );

  // === REGISTRAR VENTA ===
  const registrarVenta = async () => {
    if (!clienteSeleccionado) return alert("⚠️ Selecciona un cliente");
    if (!meseroSeleccionado) return alert("⚠️ Selecciona un mesero");
    if (carrito.length === 0) return alert("⚠️ El carrito está vacío");

    // Evitar doble venta con la misma reserva
    if (reservaSeleccionada) {
      const idRes = Number(reservaSeleccionada);
      const yaTieneVenta = (ventas || []).some((v) => {
        const idResVenta =
          v.id_reserva ?? v.idReserva ?? v.reserva?.id_reserva ?? v.reserva?.id;
        return idResVenta === idRes;
      });
      if (yaTieneVenta) {
        alert(
          "⚠️ Esta reservación ya tiene una venta registrada. No se puede volver a cobrar."
        );
        return;
      }
    }

    const payload = {
      id_cliente: Number(clienteSeleccionado),
      id_reserva: reservaSeleccionada ? Number(reservaSeleccionada) : null,
      // 👉 El id_empleado es el MESERO seleccionado
      id_empleado: Number(meseroSeleccionado),
      total: total,
      detalles: carrito.map((item) => ({
        id_producto: item.idProducto,
        producto: { id_producto: item.idProducto },
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precioUnitario),
      })),
    };

    console.log(
      "📦 Payload que se envía a /api/venta:",
      JSON.stringify(payload, null, 2)
    );
    console.log("👤 Cajero que registra:", {
      cajeroId,
      cajeroNombre,
      cajeroPuesto,
    });

    try {
      const nueva = await crearVenta(payload);
      alert("✅ Venta registrada correctamente");

      const blob = await descargarTicketVenta(
        nueva.idVenta || nueva.id_venta || nueva.id
      );
      const url = URL.createObjectURL(blob);
      setTicketUrl(url);

      setCarrito([]);
      const v = await listarVentas();
      setVentas(v || []);
    } catch (err) {
      console.error("❌ Error al registrar venta:", err);
      alert("❌ " + err.message);
    }
  };

  const verTicket = async (id) => {
    const blob = await descargarTicketVenta(id);
    const url = URL.createObjectURL(blob);
    setTicketUrl(url);
  };

  // === RENDER ===
  return (
    <main className="container py-4 text-light">
      <h1 className="text-center">Gestión de Ventas</h1>

      {/* Info del cajero logueado */}
      <div className="text-end mb-2">
        <small className="text-muted">
          Cajero actual: {cajeroNombre || "—"}{" "}
          {cajeroPuesto && `(${cajeroPuesto})`}{" "}
          {cajeroId && ` - ID: ${cajeroId}`}
        </small>
      </div>

      {/* Datos de venta */}
      <section className="card bg-dark p-3 mb-4">
        <div className="row g-3">
          <div className="col-md-3">
            <label>Cliente *</label>
            <select
              className="form-select bg-dark text-white"
              value={clienteSeleccionado}
              onChange={(e) => {
                setClienteSeleccionado(e.target.value);
                setReservaSeleccionada(""); // reset reservas al cambiar cliente
              }}
            >
              <option value="">Seleccione cliente</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombrecliente}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label>Reserva (opcional)</label>
            <select
              className="form-select bg-dark text-white"
              value={reservaSeleccionada}
              onChange={(e) => setReservaSeleccionada(e.target.value)}
            >
              <option value="">Sin reserva</option>
              {/* Solo se muestran reservas del cliente seleccionado */}
              {reservasCliente.map((r) => {
                const idR = r.id_reserva || r.id;
                const fecha = normalizarFechaReserva(r);

                const tieneVenta = (ventas || []).some((v) => {
                  const idResVenta =
                    v.id_reserva ??
                    v.idReserva ??
                    v.reserva?.id_reserva ??
                    v.reserva?.id;
                  return idResVenta === idR;
                });

                const esDeHoy = esHoy(fecha);

                let className = "";
                let extra = "";

                if (tieneVenta) {
                  className = "text-danger";
                  extra = " (YA COBRADA)";
                } else if (esDeHoy) {
                  className = "text-success";
                  extra = " (HOY)";
                }

                return (
                  <option
                    key={idR}
                    value={idR}
                    disabled={tieneVenta}
                    className={className}
                  >
                    #{idR} – {r.nombre_cliente || r.nombreCliente || "Cliente"}
                    {fecha ? ` – ${fecha}` : ""} {extra}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="col-md-3">
            <label>Mesero *</label>
            <select
              className="form-select bg-dark text-white"
              value={meseroSeleccionado}
              onChange={(e) => setMeseroSeleccionado(e.target.value)}
            >
              <option value="">Seleccione mesero</option>
              {meseros.map((m) => (
                <option key={m.id_empleado} value={m.id_empleado}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3 d-flex align-items-end">
            <button
              className="btn btn-success w-100"
              onClick={registrarVenta}
            >
              Registrar Venta
            </button>
          </div>
        </div>
      </section>

      {/* Productos */}
      <section>
        <h4>Productos</h4>
        <div className="row g-3">
          {productos.map((p) => {
            const id = p.idProducto || p.id || p.id_producto;

            const fotoFileName = p.fotoUrl || p.foto_url;
            const imgSrc = fotoFileName
              ? `${BASE_IMG_URL}${fotoFileName}`
              : "https://via.placeholder.com/240?text=IMG";

            return (
              <div key={id} className="col-md-3">
                <div className="card bg-dark text-white h-100">
                  <img
                    src={imgSrc}
                    alt={p.nombre}
                    className="card-img-top"
                    style={{ objectFit: "cover", height: "180px" }}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/240?text=IMG";
                    }}
                  />
                  <div className="card-body">
                    <h6>{p.nombre}</h6>
                    <p>{money(p.precio)}</p>
                    <div className="d-flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={qty[id] || 1}
                        onChange={(e) =>
                          setQty((q) => ({ ...q, [id]: e.target.value }))
                        }
                        className="form-control text-center bg-dark text-white"
                        style={{ width: "70px" }}
                      />
                      <button
                        className="btn btn-outline-info w-100"
                        onClick={() => agregar(p)}
                      >
                        ➕ Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Carrito */}
      <section className="mt-4">
        <h4>Carrito</h4>
        <table className="table table-dark table-striped">
          <thead>
            <tr>
              <th>Producto</th>
              <th style={{ width: "160px" }}>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {carrito.map((i) => (
              <tr key={i.idProducto}>
                <td>{i.nombre}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-outline-light"
                      type="button"
                      onClick={() => decrementarCantidad(i.idProducto)}
                    >
                      −
                    </button>
                    <span>{i.cantidad}</span>
                    <button
                      className="btn btn-sm btn-outline-light"
                      type="button"
                      onClick={() => incrementarCantidad(i.idProducto)}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>{money(i.precioUnitario)}</td>
                <td>{money(i.cantidad * i.precioUnitario)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => eliminar(i.idProducto)}
                  >
                    ✖
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h5 className="text-end text-success">
          Total: {money(total)}
        </h5>
      </section>

      {/* Ticket */}
      {ticketUrl && (
        <section className="card bg-dark mt-4 p-3">
          <h5>Ticket generado</h5>
          <iframe
            src={ticketUrl}
            title="ticket"
            width="100%"
            height="600"
            style={{ border: "none" }}
          />
        </section>
      )}
    </main>
  );
};

export default VentaComponent;
