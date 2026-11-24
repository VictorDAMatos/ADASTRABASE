import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ArtistData {
  nome: string;
  capa?: string;
  dataInicio?: string;
  reproducoesTotais: number;
  faixasOuvidas: { [titulo: string]: number };
  albumsOuvidos: { [album: string]: number }; // tempo em ms
}

interface ArtistStore {
  artistas: { [nome: string]: ArtistData };
  registrarReproducao: (artista: string, titulo: string, album: string, duracaoMs: number) => void;
  atualizarDadosArtista: (nome: string, dados: Partial<ArtistData>) => void;
}

export const useArtistStore = create<ArtistStore>()(
  persist(
    (set) => ({
      artistas: {},
      
      registrarReproducao: (artista, titulo, album, duracaoMs) => set((state) => {
        const art = state.artistas[artista] || { 
          nome: artista, reproducoesTotais: 0, faixasOuvidas: {}, albumsOuvidos: {} 
        };
        
        return {
          artistas: {
            ...state.artistas,
            [artista]: {
              ...art,
              reproducoesTotais: art.reproducoesTotais + 1,
              faixasOuvidas: { ...art.faixasOuvidas, [titulo]: (art.faixasOuvidas[titulo] || 0) + 1 },
              albumsOuvidos: { ...art.albumsOuvidos, [album]: (art.albumsOuvidos[album] || 0) + duracaoMs }
            }
          }
        };
      }),

      atualizarDadosArtista: (nome, dados) => set((state) => ({
        artistas: {
          ...state.artistas,
          [nome]: { ...(state.artistas[nome] || { nome, reproducoesTotais: 0, faixasOuvidas: {}, albumsOuvidos: {} }), ...dados }
        }
      }))
    }),
    { name: 'ad-astra-artists' }
  )
);