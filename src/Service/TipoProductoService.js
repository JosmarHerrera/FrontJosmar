// src/services/TipoProductoService.js
import { API_TIPO, apiFetch } from "../Service/apiHelper";

export const listarTipos = () => apiFetch(`${API_TIPO}`, { method: "GET" });

export const crearTipo = (tipo) =>
  apiFetch(`${API_TIPO}`, {
    method: "POST",
    body: JSON.stringify(tipo),
  });

export const actualizarTipo = (id, tipo) =>
  apiFetch(`${API_TIPO}/${id}`, {
    method: "PUT",
    body: JSON.stringify(tipo),
  });

export const eliminarTipo = (id) =>
  apiFetch(`${API_TIPO}/${id}`, { method: "DELETE" });
