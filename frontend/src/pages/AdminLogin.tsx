import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Digite su usuario y password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });

      if (!response.ok) {
        setError("Usuario o password incorrectos");
        return;
      }

      const data = await response.json();

      localStorage.setItem("crisalida_token", data.access_token);

      navigate("/admin");
    } catch (err) {
      console.error(err);
      setError("Hubo un problema al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-10">
        <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -right-28 bottom-20 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative grid w-full max-w-[980px] overflow-hidden rounded-[38px] border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden overflow-hidden border-r border-neutral-200 bg-emerald-50 p-10 dark:border-white/10 dark:bg-emerald-400/10 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-white/70 blur-3xl dark:bg-white/5" />

            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                Crisálida Admin
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-neutral-950 dark:text-white">
                Gestión interna del colectivo
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-white/65">
                Accede para administrar obras, artistas, eventos y pedidos de
                Crisálida Market.
              </p>
            </div>

            <div className="relative rounded-[28px] border border-emerald-200 bg-white/70 p-5 dark:border-emerald-400/20 dark:bg-white/5">
              <p className="text-sm font-black text-neutral-950 dark:text-white">
                Acceso privado
              </p>

              <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-white/55">
                Este espacio es solo para miembros autorizados de la colectiva.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 p-2 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10">
                  <img
                    src="/uploads/crisalida.png"
                    alt="Crisálida"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>

                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                  Panel Crisálida
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
                  Panel administrativo
                </h1>

                <p className="mt-2 text-sm text-neutral-500 dark:text-white/55">
                  Solo acceso para Crisálida
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-black text-neutral-700 dark:text-white/75">
                    Usuario
                  </label>

                  <input
                    type="text"
                    className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400 dark:focus:bg-white/10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite su usuario"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-neutral-700 dark:text-white/75">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 pr-12 text-base text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400 dark:focus:bg-white/10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite su password"
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-lg text-neutral-500 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-white/55 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
                      aria-label={
                        showPassword ? "Ocultar password" : "Mostrar password"
                      }
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-emerald-600 py-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                >
                  {loading ? "Ingresando..." : "Iniciar sesión"}
                </button>
              </form>

              <div className="mt-6 rounded-[24px] border border-neutral-200 bg-neutral-50 px-5 py-4 text-center dark:border-white/10 dark:bg-white/5">
                <p className="text-xs leading-relaxed text-neutral-500 dark:text-white/50">
                  Si no eres parte del equipo Crisálida, no deberías estar aquí
                  👀
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}