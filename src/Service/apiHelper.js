// src/Service/apiHelper.js

// (Opcional) Si más adelante usas Spring Cloud Gateway u otro:
export const API_GATEWAY = "http://localhost:7070";

// ==== AUTH / MICRO RESTAURANTE (8080) ====
export const API_AUTH_BASE = "http://localhost:8080/auth"; // login / registro
export const API_CLIENTES  = "http://localhost:8080/api/cliente";

// ==== MICRO RESERVACIONES (6060) ====
export const API_EMPLEADOS = "http://localhost:6060/api/empleado";
export const API_MESAS     = "http://localhost:6060/api/mesa";
export const API_RESERVAS  = "http://localhost:6060/api/reserva";
export const API_ATENDER   = "http://localhost:6060/api/atender"; // por si lo usas

// ==== MICRO FONDA (7071) ====
export const API_PRODUCTO        = "http://localhost:7071/api/producto";
export const API_TIPO            = "http://localhost:7071/api/tipoproducto";
export const API_VENTA           = "http://localhost:7071/api/venta";
export const API_DETALLE_VENTA   = "http://localhost:7071/api/detalleventa";

// ==== HELPER UNIVERSAL ====
// src/Service/apiHelper.js

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Solo ponemos Content-Type cuando NO es FormData
  if (!isFormData && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });

  // Leemos el body UNA sola vez
  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text().catch(() => "");

  if (!response.ok) {
    let msg = "";

    if (contentType.includes("application/json")) {
      try {
        const obj = raw ? JSON.parse(raw) : null;
        msg =
          obj?.message ||
          obj?.error ||
          raw ||
          `Error ${response.status}`;
      } catch {
        msg = raw || `Error ${response.status}`;
      }
    } else {
      // texto plano: "Empleado ya existe", stacktrace, etc.
      msg = raw || `Error ${response.status}`;
    }

    console.error("Error en API:", response.status, raw);
    throw new Error(msg);
  }

  // Si no hay contenido
  if (!raw) return null;

  // Si es JSON lo intentamos parsear
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Respuesta no es JSON válido, devolviendo texto:", raw);
      return raw;
    }
  }

  // Si no es JSON, regresamos el texto tal cual
  return raw;
}
