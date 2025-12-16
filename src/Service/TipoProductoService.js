// src/services/TipoProductoService.js
import { API_TIPO, API_PRODUCTO, apiFetch } from "../Service/apiHelper";

export const listarTipos = async () => {
  return apiFetch(API_TIPO);
};

export const crearTipo = async (tipo) => {
  return apiFetch(API_TIPO, {
    method: "POST",
    body: JSON.stringify(tipo),
  });
};

export const actualizarTipo = async (id, tipo) => {
  return apiFetch(`${API_TIPO}/${id}`, {
    method: "PUT",
    body: JSON.stringify(tipo),
  });
};

export const eliminarTipo = async (id) => {
  return apiFetch(`${API_TIPO}/${id}`, { method: "DELETE" });
};

// (si en algún lado usas API_PRODUCTO desde aquí)
export const listarProductos = async () => {
  return apiFetch(API_PRODUCTO);
};
