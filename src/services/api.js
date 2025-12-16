// src/services/api.js
import {
  API_GATEWAY,
  API_AUTH_BASE,
  API_EMPLEADOS,
  API_CLIENTES,
  API_PRODUCTO,
  API_TIPO,
  API_VENTA,
  API_DETALLE_VENTA,
  API_MESAS,
  API_RESERVAS,
  API_ATENDER,      // 👈 AGREGA ESTA CONSTANTE EN apiHelper
  apiFetch,
} from "../Service/apiHelper";

//
// =============== LOGIN / AUTH (MICROSERVICIO RESTAURANTE 8080) ===============
//

// Login (/auth/login)
export async function login(data) {
  return apiFetch(`${API_AUTH_BASE}/login`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Registrar usuario para EMPLEADO (/auth/register/empleado)
export async function registrarUsuarioEmpleado(data) {
  // data: { username, password, puesto, ... }
  return apiFetch(`${API_AUTH_BASE}/register/empleado`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Registrar usuario ligado a un CLIENTE existente (/auth/register/cliente/{idCliente})
export async function registrarUsuarioCliente(idCliente, data) {
  return apiFetch(`${API_AUTH_BASE}/register/cliente/${idCliente}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

//
// =============== CLIENTES (MICROSERVICIO RESTAURANTE 8080) ===============
//  ClienteController @RequestMapping("/api/cliente")
//

export async function listarClientes() {
  return apiFetch(`${API_CLIENTES}`);
}

export async function crearCliente(data) {
  return apiFetch(`${API_CLIENTES}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function actualizarCliente(id, data) {
  return apiFetch(`${API_CLIENTES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// En tu backend actual hay DELETE, no /desactivar
export async function desactivarCliente(id) {
  return apiFetch(`${API_CLIENTES}/${id}`, { method: "DELETE" });
}

// Alias
export async function eliminarCliente(id) {
  return desactivarCliente(id);
}

//
// =============== PRODUCTOS / TIPOS / VENTAS (MICRO FONDA) ===============
//  ProductoController:      /api/producto
//  TipoProductoController:  /api/tipoproducto
//  VentaController:         /api/venta
//  DetalleVentaController:  /api/detalleventa
//

// --- PRODUCTOS ---

export async function listarProductos() {
  return apiFetch(`${API_PRODUCTO}`);
}

// CREAR producto (multipart/form-data)
export async function crearProducto(data) {
  const token = localStorage.getItem("token");

  const fd = new FormData();
  fd.append("nombre", data.nombre ?? "");
  fd.append("descripcion", data.descripcion ?? "");
  fd.append("precio", data.precio ?? 0);
  fd.append("idTipo", data.idTipo);

  if (data.fotoFile) {
    fd.append("foto", data.fotoFile);
  }

  const res = await fetch(`${API_PRODUCTO}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Error creando producto:", res.status, text);
    throw new Error(
      `Error ${res.status}: ${text || "No se pudo crear el producto"}`
    );
  }

  return res.json();
}

// ACTUALIZAR producto (también multipart/form-data)
export async function actualizarProducto(id, data) {
  const token = localStorage.getItem("token");

  const fd = new FormData();
  fd.append("nombre", data.nombre ?? "");
  fd.append("descripcion", data.descripcion ?? "");
  fd.append("precio", data.precio ?? 0);
  fd.append("idTipo", data.idTipo);

  if (data.fotoFile) {
    fd.append("foto", data.fotoFile);
  }

  const res = await fetch(`${API_PRODUCTO}/${id}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Error actualizando producto:", res.status, text);
    throw new Error(
      `Error ${res.status}: ${text || "No se pudo actualizar el producto"}`
    );
  }

  return res.json();
}

export async function desactivarProducto(id) {
  return apiFetch(`${API_PRODUCTO}/${id}`, { method: "DELETE" });
}

// --- TIPOS DE PRODUCTO ---

export async function listarTipos() {
  return apiFetch(`${API_TIPO}`);
}

export async function listarTiposActivos() {
  return apiFetch(`${API_TIPO}/activos`);
}

export async function crearTipo(data) {
  return apiFetch(`${API_TIPO}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function actualizarTipo(id, data) {
  return apiFetch(`${API_TIPO}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarTipo(id) {
  return apiFetch(`${API_TIPO}/${id}`, { method: "DELETE" });
}

// --- VENTAS ---

export async function listarVentas(fecha = null) {
  const url = fecha
    ? `${API_VENTA}?fecha=${encodeURIComponent(fecha)}`
    : `${API_VENTA}`;
  return apiFetch(url);
}

export async function crearVenta(data) {
  return apiFetch(`${API_VENTA}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function actualizarVenta(id, data) {
  return apiFetch(`${API_VENTA}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarVenta(id) {
  return apiFetch(`${API_VENTA}/${id}`, { method: "DELETE" });
}

// Ticket PDF
export async function descargarTicketVenta(id) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_VENTA}/${id}/ticket`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("Error descargando ticket:", response.status, text);
    throw new Error(`Error ${response.status}: ${text || "Error desconocido"}`);
  }

  return await response.blob();
}

// --- DETALLE VENTAS ---

export async function listarDetalleVenta() {
  return apiFetch(`${API_DETALLE_VENTA}`);
}

export async function listarDetalleVentaPorVenta(idVenta) {
  return apiFetch(`${API_DETALLE_VENTA}/venta/${idVenta}`);
}

export async function crearDetalleVenta(data) {
  return apiFetch(`${API_DETALLE_VENTA}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function actualizarDetalleVenta(id, data) {
  return apiFetch(`${API_DETALLE_VENTA}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarDetalleVenta(id) {
  return apiFetch(`${API_DETALLE_VENTA}/${id}`, { method: "DELETE" });
}

//
// =============== EMPLEADOS / MESAS / RESERVAS (MICRO RESERVACIONES 9090) ===============
//

// --- EMPLEADOS ---

export async function listarEmpleados() {
  return apiFetch(`${API_EMPLEADOS}`);
}

export async function listarMeserosActivos() {
  return apiFetch(`${API_EMPLEADOS}/meseros`);
}

export async function crearEmpleado(data) {
  return apiFetch(`${API_EMPLEADOS}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function actualizarEmpleado(id, data) {
  return apiFetch(`${API_EMPLEADOS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarEmpleado(id) {
  return apiFetch(`${API_EMPLEADOS}/${id}`, { method: "DELETE" });
}

// Vincular empleado a usuario
export async function vincularEmpleadoUsuario(idEmpleado, idUsuario) {
  return apiFetch(
    `${API_EMPLEADOS}/${idEmpleado}/vincular-usuario/${idUsuario}`,
    {
      method: "PUT",
    }
  );
}

// --- MESAS ---

export async function listarMesas() {
  return apiFetch(`${API_MESAS}`);
}

export async function crearMesa(data) {
  return apiFetch(`${API_MESAS}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function actualizarMesa(id, data) {
  return apiFetch(`${API_MESAS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarMesa(id) {
  return apiFetch(`${API_MESAS}/${id}`, { method: "DELETE" });
}

export async function listarMesasDisponibles(fecha) {
  return apiFetch(
    `${API_MESAS}/disponibles?fecha=${encodeURIComponent(fecha)}`
  );
}

// --- RESERVAS ---

export async function listarReservas(fecha = null) {
  const url = fecha
    ? `${API_RESERVAS}?fecha=${encodeURIComponent(fecha)}`
    : `${API_RESERVAS}`;
  return apiFetch(url);
}

export async function crearReserva(data) {
  return apiFetch(`${API_RESERVAS}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function actualizarReserva(id, data) {
  return apiFetch(`${API_RESERVAS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarReserva(id) {
  return apiFetch(`${API_RESERVAS}/${id}`, { method: "DELETE" });
}

export async function confirmarReserva(id) {
  return apiFetch(`${API_RESERVAS}/${id}/confirmar`, { method: "PUT" });
}

export async function cancelarReserva(id) {
  return apiFetch(`${API_RESERVAS}/${id}/cancelar`, { method: "PUT" });
}

//
// =============== ATENDER (MICRO RESERVACIONES 9090) ===============
//  AtenderController: /api/atender
//

export async function listarAtenciones() {
  return apiFetch(`${API_ATENDER}`);
}

export async function crearAtencion(data) {
  if (!data?.idVenta || !data?.idEmpleado) {
    console.error("❌ Datos inválidos al crear atención:", data);
    throw new Error("Faltan campos obligatorios (idVenta o idEmpleado).");
  }

  // 🔹 AJUSTE CLAVE: renombrar campos al formato que espera Spring
  const payload = {
    id_venta: data.idVenta,
    id_empleado: data.idEmpleado,
  };

  return apiFetch(`${API_ATENDER}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function eliminarAtencion(idAtender) {
  return apiFetch(`${API_ATENDER}/${idAtender}`, { method: "DELETE" });
}

export async function obtenerAtencion(idAtender) {
  return apiFetch(`${API_ATENDER}/${idAtender}`);
}

export async function obtenerEmpleadoPorVenta(idVenta) {
  return apiFetch(`${API_ATENDER}/venta/${idVenta}`);
}
