import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("joel");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        setError("Usuario o contraseña incorrectos");
        return;
      }

      const data = (await response.json()) as { access_token: string };

      // Guardamos token
      localStorage.setItem("crisalida_token", data.access_token);

      // Vamos al panel admin
      navigate("/admin");
    } catch (err) {
      console.error(err);
      setError("Hubo un problema al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-negroSuave flex items-center justify-center px-4">
      <div className="bg-blancoPuro rounded-2xl shadow-xl max-w-md w-full p-8">
        <h1 className="text-2xl font-bold mb-2 text-center text-negroSuave">
          Panel administrativo
        </h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Solo acceso para Crisálida
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-verdeEsmeralda"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="joel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-verdeEsmeralda"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-verdeEsmeralda text-white font-semibold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Si no eres parte del equipo Crisálida, no deberías estar aquí 👀
        </p>
      </div>
    </div>
  );
}