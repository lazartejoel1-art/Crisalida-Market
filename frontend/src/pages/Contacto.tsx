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
    url: "https://instagram.com/crisalida.collective",
    color: "group-hover:text-pink-500",
  },
  {
    name: "TikTok",
    icon: <FaTiktok />,
    url: "https://www.tiktok.com/@crisalida_8?_r=1&_t=ZS-96EEFsBsywP",
    color: "group-hover:text-neutral-950 dark:group-hover:text-white",
  },
  {
    name: "Facebook",
    icon: <FaFacebookF />,
    url: "https://www.facebook.com/share/18RT8qmWAJ/",
    color: "group-hover:text-blue-500",
  },
  {
    name: "Gmail",
    icon: <FaEnvelope />,
    url: "mailto:crisalida.contact@gmail.com",
    color: "group-hover:text-red-500",
  },
];

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <main className="flex-1">
        <section className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-8 lg:py-10">
          <div className="mx-auto w-full max-w-[1180px]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="relative overflow-hidden rounded-[38px] border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10 sm:p-8 lg:p-10"
            >
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
              <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-white/70 blur-3xl dark:bg-white/5" />

              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                  Contacto Crisálida
                </p>

                <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-neutral-950 dark:text-white sm:text-5xl lg:text-6xl">
                  Conversemos
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-white/65 sm:text-base">
                  Crisálida es un espacio vivo. Si deseas colaborar,
                  escribirnos o simplemente sentir el pulso de la colectiva,
                  estos son nuestros canales.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-6 rounded-[38px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-7 lg:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {socials.map((s, i) => (
                  <motion.a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.08, duration: 0.4 }}
                    className="group relative overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
                  >
                    <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-400/0 blur-2xl transition group-hover:bg-emerald-400/20" />

                    <div
                      className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 bg-white text-2xl text-neutral-600 transition dark:border-white/10 dark:bg-neutral-950 dark:text-white/70 ${s.color}`}
                    >
                      {s.icon}
                    </div>

                    <div className="relative mt-4">
                      <p className="text-sm font-black text-neutral-950 dark:text-white">
                        {s.name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500 dark:text-white/55">
                        {s.name === "Gmail"
                          ? "Escríbenos directamente"
                          : "Síguenos y conecta"}
                      </p>

                      <p className="mt-4 text-xs font-black text-emerald-700 opacity-0 transition group-hover:opacity-100 dark:text-emerald-300">
                        Abrir canal →
                      </p>
                    </div>
                  </motion.a>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="mt-8 rounded-[30px] border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-400/20 dark:bg-emerald-400/10"
              >
                <p className="text-sm italic text-neutral-700 dark:text-white/75">
                  “Toda crisálida necesita contacto para transformarse.”
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  Colectiva de Arte Crisálida
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-neutral-500 dark:text-white/45 sm:flex-row">
          <p>
            © 2025 Colectiva de Arte Crisálida. Todos los derechos reservados.
          </p>

          <p className="font-semibold text-emerald-700 dark:text-emerald-300">
            Contacto abierto, arte vivo
          </p>
        </div>
      </footer>
    </div>
  );
}