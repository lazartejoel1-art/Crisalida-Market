import type { Obra, Artista } from "./types";

const API_URL = "http://localhost:3000";

async function fetchData<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}/${endpoint}`);

  if (!response.ok) {
    throw new Error(`Error al obtener ${endpoint}`);
  }

  return response.json();
}

export function fetchObras(): Promise<Obra[]> {
  return fetchData<Obra[]>("obras");
}

export function fetchArtistas(): Promise<Artista[]> {
  return fetchData<Artista[]>("artistas");
}
