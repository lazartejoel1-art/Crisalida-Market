export interface Artista {
  id: number;
  nombre: string;
  descripcion: string;
  foto?: string | null;      // ✔ para archivos locales
  fotoUrl?: string | null;   // ✔ para URLs (Cloudinary o externas)
}

export interface Obra {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
  imagen?: string | null;     // ✔ local
  imagenUrl?: string | null;  // ✔ URL externa
  stock: number;
  artista: Artista;
}