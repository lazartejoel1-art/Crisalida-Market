import type { Obra, Artista } from "./types";

export const API_URL =
  import.meta.env.VITE_API_URL || "https://crisalida-market.onrender.com";

export function buildImageUrl(image?: string | null): string | null {
  if (!image) return null;

  let value = String(image).trim();

  if (!value) return null;

  if (value.startsWith("/uploads/https://")) {
    value = value.replace("/uploads/", "");
  }

  if (value.startsWith("uploads/https://")) {
    value = value.replace("uploads/", "");
  }

  if (value.startsWith("/uploads/http://")) {
    value = value.replace("/uploads/", "");
  }

  if (value.startsWith("uploads/http://")) {
    value = value.replace("uploads/", "");
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    return `${API_URL}${value}`;
  }

  if (value.startsWith("uploads/")) {
    return `${API_URL}/${value}`;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/uploads/${value}`;
}

async function fetchData<T>(endpoint: string): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint.slice(1)
    : endpoint;

  const response = await fetch(`${API_URL}/${cleanEndpoint}`);

  if (!response.ok) {
    throw new Error(`Error al obtener ${cleanEndpoint}`);
  }

  return response.json();
}

export function fetchObras(): Promise<Obra[]> {
  return fetchData<Obra[]>("obras");
}

export function fetchObraById(id: string | number): Promise<Obra> {
  return fetchData<Obra>(`obras/${id}`);
}

export function fetchArtistas(): Promise<Artista[]> {
  return fetchData<Artista[]>("artistas");
}