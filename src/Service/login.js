// src/Service/login.js
import { API_AUTH_BASE, apiFetch } from "./apiHelper";

export async function login(data) {
  return apiFetch(`${API_AUTH_BASE}/login`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
