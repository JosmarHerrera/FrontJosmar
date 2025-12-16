// src/Service/ReservasService.js
import { API_MESAS, API_EMPLEADOS, API_RESERVAS, apiFetch } from "./apiHelper";

// ===== Mesas =====
export const listarMesas = () => apiFetch(`${API_MESAS}`, { method: "GET" });
export const crearMesa = (data) =>
  apiFetch(`${API_MESAS}`, { method: "POST", body: JSON.stringify(data) });
export const actualizarMesa = (id, data) =>
  apiFetch(`${API_MESAS}/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const eliminarMesa = (id) =>
  apiFetch(`${API_MESAS}/${id}`, { method: "DELETE" });

// ===== Empleados =====
export const listarEmpleados = () => apiFetch(`${API_EMPLEADOS}`, { method: "GET" });

export const crearEmpleado = (data) => {
  if (!data.password || !data.password.trim()) {
    return Promise.reject(new Error("El password es obligatorio"));
  }
  return apiFetch(`${API_EMPLEADOS}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const actualizarEmpleado = (id, data) => {
  const payload = { ...data };
  if (!payload.password || !payload.password.trim()) delete payload.password;
  return apiFetch(`${API_EMPLEADOS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const eliminarEmpleado = (id) =>
  apiFetch(`${API_EMPLEADOS}/${id}`, { method: "DELETE" });

// ===== Reservas =====
export const listarReservas = () => apiFetch(`${API_RESERVAS}`, { method: "GET" });
export const crearReserva = (data) =>
  apiFetch(`${API_RESERVAS}`, { method: "POST", body: JSON.stringify(data) });
export const actualizarReserva = (id, data) =>
  apiFetch(`${API_RESERVAS}/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const eliminarReserva = (id) =>
  apiFetch(`${API_RESERVAS}/${id}`, { method: "DELETE" });

export const confirmarReserva = (id) =>
  apiFetch(`${API_RESERVAS}/${id}/confirmar`, { method: "PUT" });

export const cancelarReserva = (id) =>
  apiFetch(`${API_RESERVAS}/${id}/cancelar`, { method: "DELETE" });
