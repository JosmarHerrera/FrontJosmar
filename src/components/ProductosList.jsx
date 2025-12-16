// src/components/ProductosList.jsx
import { useEffect, useMemo, useState } from "react";
import {
  listarProductos,
  desactivarProducto,
  actualizarProducto,
  crearProducto,
  listarTipos,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const BASE_IMG_URL = "https://fondajosmar-production.up.railway.app/uploads/";

export default function ProductosList() {
  const { user } = useAuth();
  const rawRoles = user?.roles || [];

  // ===== ROLES / PERMISOS =====
  const hasRole = (role) => {
    const withPrefix = role.startsWith("ROLE_") ? role : `ROLE_${role}`;
    const simple = withPrefix.replace("ROLE_", "");
    return rawRoles.includes(withPrefix) || rawRoles.includes(simple);
  };

  const isAdmin = hasRole("ADMIN");
  const isSupervisor = hasRole("SUPERVISOR");
  const isCajero = hasRole("CAJERO");
  // const isCliente = hasRole("CLIENTE");

  const canManageProductos = isAdmin || isSupervisor || isCajero;

  const [productos, setProductos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [error, setError] = useState("");

  // Formulario (con archivo)
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    idTipo: "",
    fotoFile: null,
  });
  const [modoEditar, setModoEditar] = useState(false);
  const [idEdit, setIdEdit] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [vista, setVista] = useState("grid");

  const fmt = (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return v ?? "";
    return n.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const mapaTipos = useMemo(() => {
    const m = new Map();
    tipos.forEach((t) => m.set(String(t.id_tipo || t.idTipo), t.tipo));
    return m;
  }, [tipos]);

  // ===== CARGA DE DATOS =====
  useEffect(() => {
    (async () => {
      try {
        const [prods, tiposResp] = await Promise.all([
          listarProductos(),
          listarTipos(),
        ]);
        setProductos(prods ?? []);
        setTipos(tiposResp ?? []);
        setError("");
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los productos o los tipos.");
      }
    })();
  }, []);

  const recargarProductos = async () => {
    try {
      const data = await listarProductos();
      setProductos(data ?? []);
      setError("");
    } catch (e) {
      console.error(e);
      setError("No se pudieron recargar los productos.");
    }
  };

  // ===== FORMULARIO =====
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, fotoFile: file }));
  };

  const resetForm = () =>
    setForm({
      nombre: "",
      descripcion: "",
      precio: "",
      idTipo: "",
      fotoFile: null,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManageProductos) {
      alert("No tienes permisos para modificar productos.");
      return;
    }

    const payload = {
      ...form,
      idTipo: Number(form.idTipo),
    };

    try {
      if (modoEditar) {
        await actualizarProducto(idEdit, payload);
        alert("✅ Producto actualizado correctamente");
      } else {
        await crearProducto(payload);
        alert("✅ Producto agregado correctamente");
      }
      await recargarProductos();
      setModoEditar(false);
      setIdEdit(null);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("❌ Ocurrió un error al guardar el producto");
    }
  };

  const handleEditar = (p) => {
    if (!canManageProductos) return;

    setModoEditar(true);
    setIdEdit(p.idProducto);
    setForm({
      nombre: p.nombre ?? "",
      descripcion: p.descripcion ?? "",
      precio: p.precio ?? "",
      idTipo: p.idTipo ?? p.tipo?.id_tipo ?? "",
      fotoFile: null,
    });
  };

  const handleCancelar = () => {
    setModoEditar(false);
    setIdEdit(null);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!canManageProductos) {
      alert("No tienes permisos para modificar productos.");
      return;
    }

    if (window.confirm("¿Desactivar este producto?")) {
      try {
        await desactivarProducto(id);
        alert("✅ Producto desactivado correctamente");
        await recargarProductos();
      } catch (err) {
        console.error(err);
        alert("❌ Ocurrió un error al desactivar el producto");
      }
    }
  };

  // ===== FILTROS =====
  const productosFiltrados = useMemo(() => {
    return (productos ?? []).filter((p) => {
      const coincideBusqueda =
        (p.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.descripcion ?? "").toLowerCase().includes(busqueda.toLowerCase());

      const coincideTipo =
        filtroTipo === "" ||
        String(p.idTipo ?? p.tipo?.id_tipo) === String(filtroTipo);

      const precioNum = parseFloat(p.precio);
      const minOk =
        precioMin === "" ||
        (!Number.isNaN(precioNum) && precioNum >= parseFloat(precioMin));
      const maxOk =
        precioMax === "" ||
        (!Number.isNaN(precioNum) && precioNum <= parseFloat(precioMax));

      return coincideBusqueda && coincideTipo && minOk && maxOk;
    });
  }, [productos, busqueda, filtroTipo, precioMin, precioMax]);

  const formColClass = canManageProductos ? "col-12 col-lg-4" : "d-none";
  const listaColClass = canManageProductos ? "col-12 col-lg-8" : "col-12";

  // ===== RENDER =====
  return (
    <div className="container my-4">
      <h2 className="text-2xl fw-bold mb-3 text-center">
        {modoEditar
          ? "Editar Producto"
          : canManageProductos
          ? "Nuevo Producto"
          : "Productos"}
      </h2>

      {/* Barra superior de filtros */}
      <div className="card-soft mb-3 p-2 d-flex flex-wrap gap-2 align-items-center">
        <input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="form-control"
          style={{ maxWidth: 260, color: "#000" }}
        />
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="form-select"
          style={{ maxWidth: 200, color: "#000" }}
        >
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.id_tipo || t.idTipo} value={t.id_tipo || t.idTipo}>
              {t.tipo}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Precio mínimo"
          value={precioMin}
          onChange={(e) => setPrecioMin(e.target.value)}
          className="form-control"
          style={{ maxWidth: 160, color: "#000" }}
        />
        <input
          type="number"
          placeholder="Precio máximo"
          value={precioMax}
          onChange={(e) => setPrecioMax(e.target.value)}
          className="form-control"
          style={{ maxWidth: 160, color: "#000" }}
        />

        <div className="ms-auto d-flex gap-1">
          <button
            type="button"
            className={`btn btn-sm ${
              vista === "grid" ? "btn-primary" : "btn-outline-secondary"
            }`}
            onClick={() => setVista("grid")}
          >
            🗂️ Tarjetas
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              vista === "table" ? "btn-primary" : "btn-outline-secondary"
            }`}
            onClick={() => setVista("table")}
          >
            📋 Tabla
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
        {/* Formulario: SOLO para admin / supervisor / cajero */}
        <div className={formColClass}>
          {canManageProductos && (
            <form onSubmit={handleSubmit} className="card p-3 shadow-sm">
              <label className="form-label fw-semibold">Nombre *</label>
              <input
                name="nombre"
                placeholder="Nombre"
                value={form.nombre}
                onChange={handleChange}
                className="form-control mb-2"
                required
              />

              <label className="form-label fw-semibold">Descripción</label>
              <input
                name="descripcion"
                placeholder="Descripción"
                value={form.descripcion}
                onChange={handleChange}
                className="form-control mb-2"
              />

              <label className="form-label fw-semibold">Precio *</label>
              <input
                name="precio"
                placeholder="Precio"
                type="number"
                value={form.precio}
                onChange={handleChange}
                className="form-control mb-2"
                required
              />

              <label className="form-label fw-semibold">Tipo *</label>
              <select
                name="idTipo"
                value={form.idTipo}
                onChange={handleChange}
                required
                className="form-select mb-2"
              >
                <option value="">Selecciona un tipo *</option>
                {tipos.map((t) => (
                  <option
                    key={t.id_tipo || t.idTipo}
                    value={t.id_tipo || t.idTipo}
                  >
                    {t.tipo}
                  </option>
                ))}
              </select>

              <label className="form-label fw-semibold">Imagen</label>
              <input
                type="file"
                accept="image/*"
                className="form-control mb-3"
                onChange={handleFileChange}
              />

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  {modoEditar ? "Actualizar Producto" : "Guardar Producto"}
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

        {/* Listado de productos (siempre visible) */}
        <div className={listaColClass}>
          {vista === "grid" ? (
            <div className="mini-grid">
              {productosFiltrados.length === 0 ? (
                <div className="text-center text-body-secondary py-4 w-100">
                  No se encontraron productos
                </div>
              ) : (
                productosFiltrados.map((p) => {
                  const fotoFileName = p.fotoUrl || p.foto_url;
                  const imgSrc = fotoFileName
                    ? `${BASE_IMG_URL}${fotoFileName}`
                    : "https://via.placeholder.com/240?text=IMG";

                  return (
                    <div className="mini-card mini-dark" key={p.idProducto}>
                      {canManageProductos && (
                        <div className="mini-actions">
                          <button
                            className="mini-btn"
                            title="Editar"
                            onClick={() => handleEditar(p)}
                          >
                            ✏️
                          </button>
                          <button
                            className="mini-btn danger"
                            title="Desactivar"
                            onClick={() => handleDelete(p.idProducto)}
                          >
                            🗑️
                          </button>
                        </div>
                      )}

                      <div className="mini-thumb thumb-dark">
                        <img
                          src={imgSrc}
                          alt={p.nombre}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/240?text=IMG";
                          }}
                        />
                      </div>

                      <div className="mini-body">
                        <div
                          className="mini-title text-bright"
                          title={p.nombre}
                        >
                          {p.nombre}
                        </div>
                        <div className="mini-sub text-dim">
                          {p.descripcion || "Sin descripción"}
                        </div>
                        <div className="mini-row">
                          <span className="mini-price">
                            ${fmt(p.precio)}
                          </span>
                          <span className="mini-badge">
                            {mapaTipos.get(
                              String(p.idTipo ?? p.tipo?.id_tipo)
                            ) || `Tipo #${p.idTipo}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            // Tabla
            <div className="card-soft p-0 surface-dark">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 72 }}>ID</th>
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Tipo</th>
                      {canManageProductos && (
                        <th style={{ width: 170 }} className="text-end">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canManageProductos ? 5 : 4}
                          className="text-center py-4 text-body-secondary"
                        >
                          No se encontraron productos
                        </td>
                      </tr>
                    ) : (
                      productosFiltrados.map((p) => {
                        const fotoFileName = p.fotoUrl || p.foto_url;
                        const imgSrc = fotoFileName
                          ? `${BASE_IMG_URL}${fotoFileName}`
                          : "https://via.placeholder.com/64?text=IMG";

                        return (
                          <tr key={p.idProducto}>
                            <td>
                              <span className="badge bg-secondary-subtle text-secondary-emphasis">
                                #{p.idProducto}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <img
                                  src={imgSrc}
                                  alt={p.nombre}
                                  style={{
                                    width: 56,
                                    height: 56,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    marginRight: 8,
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://via.placeholder.com/64?text=IMG";
                                  }}
                                />
                                <div>
                                  <div className="fw-semibold">
                                    {p.nombre}
                                  </div>
                                  <small className="text-body-secondary">
                                    {p.descripcion || "Sin descripción"}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td className="fw-semibold">
                              ${fmt(p.precio)}
                            </td>
                            <td>
                              <span className="badge bg-secondary-subtle text-secondary-emphasis border border-1">
                                {mapaTipos.get(
                                  String(p.idTipo ?? p.tipo?.id_tipo)
                                ) || `Tipo #${p.idTipo}`}
                              </span>
                            </td>
                            {canManageProductos && (
                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-light me-1"
                                  title="Editar"
                                  onClick={() => handleEditar(p)}
                                >
                                  ✏️
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  title="Desactivar"
                                  onClick={() => handleDelete(p.idProducto)}
                                >
                                  🗑️
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-body-secondary">
              Mostrando {productosFiltrados.length} de {productos.length}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
