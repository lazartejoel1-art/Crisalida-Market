import { Link, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-negroSuave text-blancoPuro flex flex-col">
      {/* NAVBAR PÚBLICO */}
      <header className="border-b border-gray-800 bg-[#050816]/80 backdrop-blur">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-verdeEsmeralda">
              Crisálida
            </span>
            <span className="text-xs text-gray-400">colectiva de arte</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link to="/tienda" className="hover:text-verdeEsmeralda">
              Tienda
            </Link>
            <Link to="/artistas" className="hover:text-verdeEsmeralda">
              Artistas
            </Link>
            <Link to="/carrito" className="hover:text-verdeEsmeralda">
              Carrito
            </Link>
          </div>
        </nav>
      </header>

      {/* AQUÍ SE RENDERIZAN LAS PÁGINAS HIJAS */}
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-800 text-center text-xs text-gray-500 py-3">
        © {new Date().getFullYear()} Crisálida · Arte en movimiento 
      </footer>
    </div>
  );
}
