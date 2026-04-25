export default function ArtistsPublicPage() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-verdeEsmeralda mb-2">
        Artistas de Crisálida 🎨
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        Aquí mostraremos las fichas públicas de Ariel, Antonella, Camila, Deyna,
        Yamina, Luz, Vero y Joel, conectadas al backend de /artistas.
      </p>

      <div className="border border-dashed border-gray-700 rounded-xl p-6 text-center text-gray-400 text-sm">
        Próximamente: cards de artistas con foto, bio y link a sus obras.
      </div>
    </section>
  );
}
