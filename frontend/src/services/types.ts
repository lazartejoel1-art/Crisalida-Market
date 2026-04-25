export interface Artista {
  id: number;
  nombre: string;
  descripcion: string;
  foto?: string;
}

export interface Obra {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
  imagen?: string;
  imagenUrl?: string; // 🔥 agregado
  stock: number;
  artista: Artista;
}
