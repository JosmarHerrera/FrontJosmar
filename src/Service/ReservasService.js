// src/Service/ReservasService.js
import {
  API_RESERVAS,
  API_MESAS,
  API_EMPLEADOS,
  apiFetch,
} from "./apiHelper";

// ===== Mesas =====
export function listarMesas() {
  return apiFetch(API_MESAS);
}
export function crearMesa(data) {
  return apiFetch(API_MESAS, { method: "POST", body: JSON.stringify(data) });
}
export function actualizarMesa(id, data) {
  return apiFetch(`${API_MESAS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
export function eliminarMesa(id) {
  return apiFetch(`${API_MESAS}/${id}`, { method: "DELETE" });
}

// ===== Empleados =====
export function listarEmpleados() {
  return apiFetch(API_EMPLEADOS);
}
export function crearEmpleado(data) {
  if (!data.password || !data.password.trim()) {
    return Promise.reject(new Error("El password es obligatorio"));
  }
  return apiFetch(API_EMPLEADOS, { method: "POST", body: JSON.stringify(data) });
}
export function actualizarEmpleado(id, data) {
  const payload = { ...data };
  if (!payload.password || !payload.password.trim()) {
    delete payload.password;
  }
  return apiFetch(`${API_EMPLEADOS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
export function eliminarEmpleado(id) {
  return apiFetch(`${API_EMPLEADOS}/${id}`, { method: "DELETE" });
}

// ===== Reservas =====
export function listarReservas() {
  return apiFetch(API_RESERVAS);
}
export function crearReserva(data) {
  return apiFetch(API_RESERVAS, { method: "POST", body: JSON.stringify(data) });
}
export function actualizarReserva(id, data) {
  return apiFetch(`${API_RESERVAS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
export function eliminarReserva(id) {
  return apiFetch(`${API_RESERVAS}/${id}`, { method: "DELETE" });
}
export function confirmarReserva(id) {
  return apiFetch(`${API_RESERVAS}/${id}/confirmar`, { method: "PUT" });
}
export function cancelarReserva(id) {
  return apiFetch(`${API_RESERVAS}/${id}/cancelar`, { method: "DELETE" });
}
