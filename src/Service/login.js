/*
export async function login(nombre, password, tipo) {
  let baseUrl = "";
  let endpoint = "";

  if (tipo === "CLIENTE") {
    baseUrl = "http://localhost:8080";
    endpoint = "/api/cliente/login";
  } else if (tipo === "EMPLEADO") {
    baseUrl = "http://localhost:9090/api/empleados/login";
   
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, password }),
  });

  if (!res.ok) {
    throw new Error("Error en login");
  }

  return res.json();
}
  */
