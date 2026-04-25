import { motion } from "framer-motion";
import {
  FaInstagram,
  FaTiktok,
  FaFacebookF,
  FaEnvelope,
} from "react-icons/fa";

const socials = [
  {
    name: "Instagram",
    icon: <FaInstagram />,
    url: "https://instagram.com/crisalida.collective", // cambia si deseas
    color: "hover:text-pink-500",
  },
  {
    name: "TikTok",
    icon: <FaTiktok />,
    url: "https://tiktok.com/crisalida.collective",
    color: "hover:text-white",
  },
  {
    name: "Facebook",
    icon: <FaFacebookF />,
    url: "https://facebook.com/crisalida",
    color: "hover:text-blue-500",
  },
  {
    name: "Gmail",
    icon: <FaEnvelope />,
    url: "mailto:crisalida.colectiva@gmail.com",
    color: "hover:text-red-400",
  },
];

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-negroSuave text-blancoPuro flex flex-col">
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 py-14">
          {/* Encabezado */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-12 text-center"
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Conversemos 
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Crisálida es un espacio vivo.  
              Si deseas colaborar, escribirnos o simplemente sentir el pulso de
              la colectiva, estos son nuestros canales.
            </p>
          </motion.div>

          {/* Tarjeta principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-[#050816] border border-gray-800 rounded-3xl p-8 sm:p-10"
          >
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {socials.map((s, i) => (
                <motion.a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`
                    group relative rounded-2xl border border-gray-800
                    bg-black/30 backdrop-blur
                    p-6 flex flex-col items-center justify-center gap-4
                    transition hover:border-verdeEsmeralda
                  `}
                >
                  {/* Icono */}
                  <div
                    className={`
                      text-3xl text-gray-300 transition
                      ${s.color}
                    `}
                  >
                    {s.icon}
                  </div>

                  {/* Texto */}
                  <div className="text-center">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {s.name === "Gmail"
                        ? "Escríbenos directamente"
                        : "Síguenos y conecta"}
                    </p>
                  </div>

                  {/* Glow suave */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    <div className="absolute inset-0 bg-verdeEsmeralda/5 blur-xl" />
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Mensaje final */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 text-center"
            >
              <p className="text-sm text-gray-300 italic">
                “Toda crisálida necesita contacto para transformarse.”
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Colectiva de Arte Crisálida
              </p>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#050816] text-gray-400">
        <div className="max-w-5xl mx-auto px-4 py-4 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2025 Colectiva de Arte Crisálida. Todos los derechos reservados.</p>
          <p className="opacity-80">Contacto abierto, arte vivo </p>
        </div>
      </footer>
    </div>
  );
}
