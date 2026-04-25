const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function login(username: string, password: string): Promise<void> {
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
    let message = "Error al iniciar sesión";

    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // ignoramos error al parsear
    }

    throw new Error(message);
  }

  const data = (await response.json()) as {
    access_token: string;
    user?: unknown;
  };

  localStorage.setItem("crisalida_token", data.access_token);
}

export function logout(): void {
  localStorage.removeItem("crisalida_token");
}

export function getToken(): string | null {
  return localStorage.getItem("crisalida_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}