// ===== Base URLs =====
const API_RESERVAS  = "http://localhost:9090/api/reservas";
const API_MESAS     = "http://localhost:9090/api/mesas";
const API_EMPLEADOS = "http://localhost:9090/api/empleados";

// ===== Helpers =====
async function httpJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} - ${text || "Error de red"}`);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ===== Mesas =====
export function listarMesas() {
  return httpJson(`${API_MESAS}`);
}
export function crearMesa(data) {
  return httpJson(`${API_MESAS}`, { method: "POST", body: JSON.stringify(data) });
}
export function actualizarMesa(id, data) {
  return httpJson(`${API_MESAS}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export function eliminarMesa(id) {
  return httpJson(`${API_MESAS}/${id}`, { method: "DELETE" });
}

// ===== Empleados =====
export function listarEmpleados() {
  return httpJson(`${API_EMPLEADOS}`);
}
export function crearEmpleado(data) {
  // password es obligatorio al crear
  if (!data.password || !data.password.trim()) {
    return Promise.reject(new Error("El password es obligatorio"));
  }
  return httpJson(`${API_EMPLEADOS}`, { method: "POST", body: JSON.stringify(data) });
}
export function actualizarEmpleado(id, data) {
  // si el password viene vacío, NO lo mandamos para no resetearlo
  const payload = { ...data };
  if (!payload.password || !payload.password.trim()) {
    delete payload.password;
  }
  return httpJson(`${API_EMPLEADOS}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}
export function eliminarEmpleado(id) {
  return httpJson(`${API_EMPLEADOS}/${id}`, { method: "DELETE" });
}

// ===== Reservas =====
export function listarReservas() {
  return httpJson(`${API_RESERVAS}`);
}
export function crearReserva(data) {
  return httpJson(`${API_RESERVAS}`, { method: "POST", body: JSON.stringify(data) });
}
export function actualizarReserva(id, data) {
  return httpJson(`${API_RESERVAS}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export function eliminarReserva(id) {
  return httpJson(`${API_RESERVAS}/${id}`, { method: "DELETE" });
}
export function confirmarReserva(id) {
  return httpJson(`${API_RESERVAS}/${id}/confirmar`, { method: "PUT" });
}
export function cancelarReserva(id) {
  return httpJson(`${API_RESERVAS}/${id}/cancelar`, { method: "DELETE" });
}
