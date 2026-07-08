import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

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
import EventosPage from "./pages/EventosPage";

type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "crisalida_theme_mode";

function getSavedTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;

    if (saved === "system" || saved === "light" || saved === "dark") {
      return saved;
    }

    return "system";
  } catch {
    return "system";
  }
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const useDark = mode === "dark" || (mode === "system" && prefersDark);

  root.classList.toggle("dark", useDark);
  root.setAttribute("data-theme", useDark ? "dark" : "light");
  root.style.colorScheme = useDark ? "dark" : "light";
}

export default function App() {
  useEffect(() => {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const onSystemThemeChange = () => {
      const currentTheme = getSavedTheme();

      if (currentTheme === "system") {
        applyTheme("system");
      }
    };

    media.addEventListener("change", onSystemThemeChange);

    return () => {
      media.removeEventListener("change", onSystemThemeChange);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
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
          <Route path="/eventos" element={<EventosPage />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>
    </div>
  );
}