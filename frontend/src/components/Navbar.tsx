import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";

type NavItem = { label: string; to: string };

type CartItem = {
  id: number;
  cantidad: number;
};

type NavbarProps = {
  title?: string;
  logoSrc?: string;
  cartTo?: string;
};

type ThemeMode = "system" | "light" | "dark";

type SocialItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  { label: "Inicio", to: "/" },
  { label: "Tienda", to: "/tienda" },
  { label: "Galería", to: "/museo" },
  { label: "Eventos", to: "/eventos" },
  { label: "Carrito", to: "/carrito" },
  { label: "Artistas", to: "/artistas" },
  { label: "Contacto", to: "/contacto" },
  { label: "Admin", to: "/admin/login" },
];

const SOCIALS: SocialItem[] = [
  {
    label: "Instagram",
    href: "https://instagram.com/crisalida.collective",
    icon: <FaInstagram />,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@crisalida_8?_r=1&_t=ZS-96EEFsBsywP",
    icon: <FaTiktok />,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/18RT8qmWAJ/",
    icon: <FaFacebookF />,
  },
  {
    label: "Gmail",
    href: "mailto:crisalida.contact@gmail.com",
    icon: <FaEnvelope />,
  },
];

const CART_KEY = "crisalida_cart";
const THEME_KEY = "crisalida_theme_mode";

function readCartCount() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];

    if (!Array.isArray(parsed)) return 0;

    return parsed.reduce((acc, item) => acc + Number(item.cantidad ?? 0), 0);
  } catch {
    return 0;
  }
}

function getInitialTheme(): ThemeMode {
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

function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(mode);

    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      // Ignorar si localStorage no está disponible
    }
  }, [mode]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = () => {
      if (mode === "system") {
        applyTheme("system");
      }
    };

    media.addEventListener("change", onChange);

    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [mode]);

  const changeTheme = () => {
    setMode((current) => {
      if (current === "system") return "light";
      if (current === "light") return "dark";
      return "system";
    });
  };

  const label =
    mode === "system" ? "" : mode === "light" ? "" : "";

  const icon = mode === "system" ? "◐" : mode === "light" ? "○" : "●";

  return (
    <button
      type="button"
      onClick={changeTheme}
      className="flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-black text-white transition hover:bg-white hover:text-black sm:px-4"
      title="Cambiar tema"
      aria-label="Cambiar tema"
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function SocialLinks({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {SOCIALS.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target={social.href.startsWith("mailto:") ? undefined : "_blank"}
          rel={
            social.href.startsWith("mailto:")
              ? undefined
              : "noopener noreferrer"
          }
          aria-label={social.label}
          title={social.label}
          className={`flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition hover:bg-white hover:text-black ${
            compact ? "h-9 w-9 text-sm" : "h-10 w-10 text-base"
          }`}
        >
          {social.icon}
        </a>
      ))}
    </div>
  );
}

export default function Navbar({
  title = "Crisálida",
  logoSrc = "/uploads/crisalida.png",
  cartTo = "/carrito",
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => readCartCount());

  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const updateCart = () => {
      setCartCount(readCartCount());
    };

    window.addEventListener("storage", updateCart);
    window.addEventListener("crisalida_cart_updated", updateCart);

    return () => {
      window.removeEventListener("storage", updateCart);
      window.removeEventListener("crisalida_cart_updated", updateCart);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-black text-white border-b border-white/10 shadow-sm">
        <div className="mx-auto flex min-h-16 w-full max-w-[1480px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-10 2xl:px-16">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white hover:text-black"
            aria-label="Abrir menú"
          >
            <span className="text-2xl leading-none">☰</span>
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-3 lg:gap-5">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-3"
              aria-label="Ir al inicio"
            >
              <img
                src={logoSrc}
                alt="Logo"
                className="h-9 w-9 rounded-full object-cover bg-white"
              />

              <div className="hidden sm:block text-center">
                <span className="block text-sm font-black tracking-wide">
                  {title}
                </span>

                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  Art Market
                </span>
              </div>
            </Link>

            <div className="hidden md:flex">
              <SocialLinks />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <Link
              to={cartTo}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white hover:text-black"
              aria-label="Abrir carrito"
            >
              <span className="text-xl leading-none">🛒</span>

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[11px] font-black text-black ring-2 ring-black">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/95">
          <div className="mx-auto flex min-h-11 w-full max-w-[1480px] items-center justify-center px-4 sm:px-6 lg:px-10">
            <div className="flex md:hidden">
              <SocialLinks compact />
            </div>

            <nav className="hidden h-11 items-center justify-center gap-1 lg:flex">
              {NAV.filter((item) => item.label !== "Carrito").map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white hover:text-black"
                >
                  {it.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute left-0 top-0 flex h-full w-[310px] max-w-[85vw] flex-col border-r border-neutral-200 bg-white text-neutral-950 shadow-2xl dark:border-white/10 dark:bg-neutral-950 dark:text-white">
            <div className="border-b border-neutral-200 p-5 dark:border-white/10">
              <div className="flex items-center justify-between gap-4">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3"
                >
                  <img
                    src={logoSrc}
                    alt="Logo"
                    className="h-11 w-11 rounded-full object-cover bg-neutral-100"
                  />

                  <div>
                    <p className="text-base font-black leading-none">{title}</p>

                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                      Art Market
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-xl font-bold text-neutral-900 transition hover:bg-black hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-black"
                  aria-label="Cerrar menú"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="mb-3 text-center text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  Redes Crisálida
                </p>

                <div className="flex justify-center gap-2">
                  {SOCIALS.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target={
                        social.href.startsWith("mailto:") ? undefined : "_blank"
                      }
                      rel={
                        social.href.startsWith("mailto:")
                          ? undefined
                          : "noopener noreferrer"
                      }
                      aria-label={social.label}
                      title={social.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-neutral-950 dark:text-white/70 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {NAV.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold text-neutral-700 transition hover:bg-black hover:text-white dark:text-white/75 dark:hover:bg-white dark:hover:text-black"
                >
                  <span>{it.label}</span>

                  {it.label === "Carrito" && cartCount > 0 ? (
                    <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-black text-black">
                      {cartCount}
                    </span>
                  ) : (
                    <span className="text-neutral-300 transition group-hover:text-white/60 dark:text-white/25 dark:group-hover:text-black/60">
                      →
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="border-t border-neutral-200 p-5 dark:border-white/10">
              <Link
                to="/tienda"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-600 dark:bg-white dark:text-black dark:hover:bg-emerald-400"
              >
                Ir a la tienda
              </Link>

              <div className="mt-3 flex justify-center">
                <ThemeToggle />
              </div>

              <p className="mt-4 text-center text-[11px] text-neutral-400">
                © 2025 Colectiva Crisálida
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}