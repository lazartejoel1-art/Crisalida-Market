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
    <div className="min-h-screen bg-negroSuave flex items-center justify-center px-4 py-10">
      <div className="bg-blancoPuro rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-200">
        <div className="text-center mb-7">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-negroSuave flex items-center justify-center text-2xl">
            🦋
          </div>

          <h1 className="text-3xl font-extrabold text-negroSuave">
            Panel administrativo
          </h1>

          <p className="text-sm text-gray-600 mt-2">
            Solo acceso para Crisálida
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Usuario
            </label>

            <input
              type="text"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base font-semibold text-black bg-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-verdeEsmeralda focus:border-verdeEsmeralda transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite su usuario"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-14 text-base font-semibold text-black bg-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-verdeEsmeralda focus:border-verdeEsmeralda transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite su password"
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 hover:text-verdeEsmeralda transition"
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-verdeEsmeralda text-black font-extrabold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-5 text-center leading-relaxed">
          Si no eres parte del equipo Crisálida, no deberías estar aquí 👀
        </p>
      </div>
    </div>
  );
}