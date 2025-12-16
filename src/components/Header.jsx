// src/components/Header.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const rawRoles = user?.roles || [];

  // helper para soportar "ROLE_ADMIN" o "ADMIN"
  const hasRole = (role) => {
    const withPrefix = role.startsWith("ROLE_") ? role : `ROLE_${role}`;
    const simple     = withPrefix.replace("ROLE_", "");
    return (
      rawRoles.includes(withPrefix) ||
      rawRoles.includes(simple)
    );
  };

  const isAdmin      = hasRole("ADMIN");
  const isSupervisor = hasRole("SUPERVISOR");
  const isCajero     = hasRole("CAJERO");
  const isMesero     = hasRole("MESERO");
  const isCliente    = hasRole("CLIENTE");

  const roleLabel =
    rawRoles.length > 0
      ? rawRoles
          .map((r) => r.replace("ROLE_", "")) // ROLE_ADMIN -> ADMIN
          .join(", ")
      : "INVITADO";

  const handleLogout = () => {
    logout(); 
    navigate("/login");
  };

  return (
    <header className="topbar d-flex align-items-center justify-content-between px-4 py-2">
      {/* Marca */}
      <div className="topbar-brand">
        <span className="fw-semibold">Restaurante ITCH</span>
      </div>

      {/* Menú principal */}
      <nav className="topbar-nav d-flex gap-3">
        {user && (
          <>
            {/* CLIENTES: admin, supervisor, cajero */}
            {(isAdmin || isSupervisor || isCajero || isCliente || isMesero ) && (
              <NavLink
                to="/"              // ⬅️ aquí va la ruta de clientes (ListClienteComponent)
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                Clientes
              </NavLink>
            )}

            {/* PRODUCTOS: admin + supervisor */}
            {(isAdmin || isSupervisor || isCajero || isCliente) && (
              <NavLink
                to="/listaProducto"  // ⬅️ coincide con tu App.jsx
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                Productos
              </NavLink>
            )}

            {/* TIPOS DE PRODUCTO */}
            {(isAdmin || isSupervisor) && (
              <NavLink
                to="/listaTipo"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                Tipos
              </NavLink>
            )}

            {/* EMPLEADOS */}
            {(isAdmin || isSupervisor) && (
              <NavLink
                to="/empleados"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                Empleados
              </NavLink>
            )}

            {/* RESERVAS */}
            {(isAdmin || isSupervisor || isCajero || isCliente) && (
              <NavLink
                to="/reservas"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                Reservas
              </NavLink>
            )}

            {/* VENTAS */}
            {(isAdmin || isCajero) && (
              <NavLink
                to="/ventas"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                Ventas
              </NavLink>
            )}

            {/* PEDIDOS (solo mesero, cuando tengas la pantalla) */}
            {(isMesero || isAdmin) && (
              <NavLink
                to="/pedidos"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                Pedidos
              </NavLink>
            )}
          </>
        )}
      </nav>

      {/* Info de sesión + botón */}
      <div className="d-flex align-items-center gap-3">
        {user ? (
          <>
            <div className="text-end small">
              <div>
                Sesión: <strong>{user.username}</strong>
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              Rol: <strong>{roleLabel}</strong>
                
              </div>
            </div>

            <button
              className="btn btn-sm btn-outline-light"
              onClick={handleLogout}
            >
              Salir
            </button>
          </>
        ) : (
          <NavLink to="/login" className="btn btn-sm btn-primary">
            Iniciar sesión
          </NavLink>
        )}
      </div>
    </header>
  );
}
