// src/services/TipoProductoService.js
const API_URL = "http://localhost:7070/api/tipo";
const API_PRODUCTOS = "http://localhost:7070/api/producto";



export const listarTipos = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Error al listar tipos");
  return await response.json();
};

export const crearTipo = async (tipo) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tipo),
  });
  if (!response.ok) throw new Error("Error al crear tipo");
  return await response.json();
};

export const actualizarTipo = async (id, tipo) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tipo),
  });
  if (!response.ok) throw new Error("Error al actualizar tipo");
  return await response.json();
};

export const eliminarTipo = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar tipo");
  return await response.text();
};
