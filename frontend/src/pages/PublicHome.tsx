import { Link } from "react-router-dom";

export default function PublicHome() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-verdeEsmeralda mb-2">
            Colectiva de arte · Crisálida
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Arte vivo, mutante y colectivo 
          </h1>
          <p className="text-gray-300 text-sm mb-6">
            Descubre las obras originales de Ariel, Antonella, Camila, Deina,
            Yamina, Luz, Vero y Joelito. Una tienda pensada para mostrar,
            cuidar y mover el arte boliviano.
          </p>

          <div className="flex gap-3">
            <Link
              to="/tienda"
              className="px-4 py-2 rounded-lg bg-verdeEsmeralda text-black text-sm font-semibold hover:opacity-90"
            >
              Ver tienda
            </Link>

            <Link
              to="/artistas"
              className="px-4 py-2 rounded-lg border border-gray-600 text-sm text-gray-200 hover:border-verdeEsmeralda"
            >
              Conocer artistas
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#050816] p-6 text-sm text-gray-300">
          <p className="mb-3">
            Aquí más adelante mostraremos un carrusel con obras destacadas,
            animaciones suaves y secciones tipo Etsy pero con identidad
            Crisálida.
          </p>
          <p className="text-xs text-gray-500">
            Por ahora es solo la estructura. Luego conectamos las obras reales
            desde el backend.
          </p>
        </div>
      </div>
    </section>
  );
}
