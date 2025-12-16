// src/App.jsx
import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";

import { ListClienteComponent } from "./components/ListClienteComponent";
import ProductosList from "./components/ProductosList";
import TipoProductoComponent from "./components/TipoProductoComponent";
import { MesaComponent } from "./components/MesaComponent";
import { VentaComponent } from "./components/VentaComponent";
import { EmpleadoComponent } from "./components/EmpleadoComponent";
import { ReservaComponent } from "./components/ReservaComponent";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage"; // ✅ NUEVO
import AtenderComponent from "./components/AtenderComponent";

import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppShell() {
  const location = useLocation();

  // Rutas donde NO queremos mostrar Header y Footer
  const hideChrome =
    location.pathname === "/login" || location.pathname === "/registro";

  return (
    <>
      {!hideChrome && <Header />}

      <Routes>
        {/* LOGIN (público) */}
        <Route path="/login" element={<LoginPage />} />

        {/* REGISTRO (público) */}
        <Route path="/registro" element={<RegisterPage />} />

        {/* RUTAS PROTEGIDAS */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <ListClienteComponent />
            </PrivateRoute>
          }
        />

        <Route
          path="/listaProducto"
          element={
            <PrivateRoute>
              <ProductosList />
            </PrivateRoute>
          }
        />

        <Route
          path="/listaTipo"
          element={
            <PrivateRoute>
              <TipoProductoComponent />
            </PrivateRoute>
          }
        />

        <Route
          path="/mesas"
          element={
            <PrivateRoute>
              <MesaComponent />
            </PrivateRoute>
          }
        />

        <Route
          path="/empleados"
          element={
            <PrivateRoute>
              <EmpleadoComponent />
            </PrivateRoute>
          }
        />

        <Route
          path="/reservas"
          element={
            <PrivateRoute>
              <ReservaComponent />
            </PrivateRoute>
          }
        />

        <Route
          path="/ventas"
          element={
            <PrivateRoute>
              <VentaComponent />
            </PrivateRoute>
          }
        />

        <Route
          path="/pedidos"
          element={
            <PrivateRoute>
              <AtenderComponent />
            </PrivateRoute>
          }
        />

        {/* Si la ruta no existe, redirige al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideChrome && <Footer />}
    </>
  );
}
