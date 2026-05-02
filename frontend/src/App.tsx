// src/App.tsx
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ThemeMiniPanel from "./components/ThemeMiniPanel";

import { applyThemeToCssVars, loadTheme } from "./theme/theme";

// Páginas
import HomePage from "./pages/HomePage";
import StorePage from "./pages/StorePage";
import WorkDetailPage from "./pages/WorkDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import ArtistsPage from "./pages/ArtistasPage";
import ContactPage from "./pages/Contacto";
import ArtistDetailPage from "./pages/ArtistDetailPage";
import MuseosPage from "./pages/MuseosPage";
import EventoDetailPage from "./pages/EventoDetailPage";

export default function App() {
  useEffect(() => {
    const t = loadTheme();
    applyThemeToCssVars(t);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "var(--c-bg)",
        color: "var(--c-text)",
      }}
    >
      <Navbar
        logoSrc="/uploads/crisalida.png"
        title="Crisálida"
        cartTo="/carrito"
      />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Público */}
          <Route path="/artistas/:id" element={<ArtistDetailPage />} />
          <Route path="/tienda" element={<StorePage />} />
          <Route path="/obra/:id" element={<WorkDetailPage />} />
          <Route path="/eventos/:id" element={<EventoDetailPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/artistas" element={<ArtistsPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/museo" element={<MuseosPage />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>

      <ThemeMiniPanel />
    </div>
  );
}