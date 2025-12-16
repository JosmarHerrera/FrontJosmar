// src/Service/apiHelper.js

export const API_GATEWAY = ""; // (no usado por ahora)

// ==== AUTH / MICRO RESTAURANTE ====
export const API_AUTH_BASE = "https://compassionate-dedication-production.up.railway.app/auth";
export const API_CLIENTES  = "https://compassionate-dedication-production.up.railway.app/api/cliente";

// ==== MICRO RESERVACIONES ====
export const API_EMPLEADOS = "https://reservasjosmar-production.up.railway.app/api/empleado";
export const API_MESAS     = "https://reservasjosmar-production.up.railway.app/api/mesa";
export const API_RESERVAS  = "https://reservasjosmar-production.up.railway.app/api/reserva";
export const API_ATENDER   = "https://reservasjosmar-production.up.railway.app/api/atender";

// ==== MICRO FONDA ====
export const API_PRODUCTO      = "https://fondajosmar-production.up.railway.app/api/producto";
export const API_TIPO          = "https://fondajosmar-production.up.railway.app/api/tipoproducto";
export const API_VENTA         = "https://fondajosmar-production.up.railway.app/api/venta";
export const API_DETALLE_VENTA = "https://fondajosmar-production.up.railway.app/api/detalleventa";

// ==== HELPER UNIVERSAL ====
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (!isFormData && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text().catch(() => "");

  if (!response.ok) {
    let msg = "";
    if (contentType.includes("application/json")) {
      try {
        const obj = raw ? JSON.parse(raw) : null;
        msg = obj?.message || obj?.error || raw || `Error ${response.status}`;
      } catch {
        msg = raw || `Error ${response.status}`;
      }
    } else {
      msg = raw || `Error ${response.status}`;
    }
    console.error("Error en API:", response.status, raw);
    throw new Error(msg);
  }

  if (!raw) return null;

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  return raw;
}
